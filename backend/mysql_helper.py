import os
import pymysql
import sqlite3
import re
import decimal
import datetime
from core.config import setting, BACKEND_DIR

try:
    _port = int(setting('MYSQL_PORT', '3307'))
except ValueError:
    _port = 3307

MYSQL_CONFIG = {
    'host': setting('MYSQL_HOST', 'localhost'),
    'port': _port,
    'user': setting('MYSQL_USER', 'root'),
    'password': setting('MYSQL_PASSWORD', '1234'),
    'charset': 'utf8mb4',
    'autocommit': True
}

# Handle SSL if configured
_mysql_ssl = setting('MYSQL_SSL', 'false').lower()
if _mysql_ssl in ('true', '1', 'yes'):
    MYSQL_CONFIG['ssl'] = {}

class MySQLRow:
    def __init__(self, description, values):
        self._keys = [desc[0] for desc in description] if description else []
        
        # Convert decimal.Decimal objects to standard float to mimic SQLite
        self._values = []
        for val in values:
            if isinstance(val, decimal.Decimal):
                self._values.append(float(val))
            else:
                self._values.append(val)
                
        self._mapping = {k: v for k, v in zip(self._keys, self._values)}

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return self._mapping[key]

    def keys(self):
        return self._keys

    def __iter__(self):
        return iter(self._values)

    def __len__(self):
        return len(self._values)

    def __repr__(self):
        return repr(dict(zip(self._keys, self._values)))

    def get(self, key, default=None):
        return self._mapping.get(key, default)

class MySQLCursorWrapper:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        if params is not None:
            # Escape literal % signs to %% first before replacing ? with %s
            query = query.replace('%', '%%')
            query = query.replace('?', '%s')
            if not isinstance(params, (list, tuple, dict)):
                params = (params,)
        else:
            query = query.replace('?', '%s')
        
        # Translate SQLite date functions
        query = re.sub(r"DATE\('now'\)", "CURDATE()", query, flags=re.IGNORECASE)
        query = re.sub(r"datetime\('now'\)", "NOW()", query, flags=re.IGNORECASE)
            
        return self._cursor.execute(query, params)

    def executemany(self, query, seq_of_params):
        if seq_of_params:
            query = query.replace('%', '%%')
            query = query.replace('?', '%s')
        else:
            query = query.replace('?', '%s')
        query = re.sub(r"DATE\('now'\)", "CURDATE()", query, flags=re.IGNORECASE)
        query = re.sub(r"datetime\('now'\)", "NOW()", query, flags=re.IGNORECASE)
        return self._cursor.executemany(query, seq_of_params)

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        return MySQLRow(self._cursor.description, row)

    def fetchall(self):
        rows = self._cursor.fetchall()
        desc = self._cursor.description
        if not desc:
            return []
        return [MySQLRow(desc, row) for row in rows]

    def __iter__(self):
        return self

    def __next__(self):
        row = self._cursor.fetchone()
        if row is None:
            raise StopIteration
        return MySQLRow(self._cursor.description, row)

    def close(self):
        return self._cursor.close()

    @property
    def lastrowid(self):
        return self._cursor.lastrowid

    def __getattr__(self, name):
        return getattr(self._cursor, name)

class MySQLConnectionWrapper:
    def __init__(self, conn):
        self._conn = conn
        self.row_factory = None

    def cursor(self):
        return MySQLCursorWrapper(self._conn.cursor())

    def commit(self):
        pass  # PyMySQL autocommit is enabled

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

# ─── SQLite Fallback Wrappers ────────────────────────────────────────────────

def _sqlite_date_format(val, fmt):
    if not val:
        return ""
    try:
        val_str = str(val).strip()
        if len(val_str) == 10:
            dt = datetime.datetime.strptime(val_str, "%Y-%m-%d")
        else:
            dt = datetime.datetime.strptime(val_str[:19], "%Y-%m-%d %H:%M:%S")
        if fmt == '%b':
            return dt.strftime('%b')
        elif fmt == '%Y-%m':
            return dt.strftime('%Y-%m')
        return dt.strftime('%Y-%m-%d')
    except Exception:
        return str(val)

def _sqlite_year(val):
    if not val:
        return 0
    try:
        return int(str(val)[:4])
    except Exception:
        return 0

def _sqlite_month(val):
    if not val:
        return 0
    try:
        return int(str(val)[5:7])
    except Exception:
        return 0

class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query, params=None):
        query = re.sub(r"CURDATE\(\)", "DATE('now')", query, flags=re.IGNORECASE)
        query = re.sub(r"NOW\(\)", "DATETIME('now')", query, flags=re.IGNORECASE)
        query = re.sub(r"INSERT IGNORE INTO", "INSERT OR IGNORE INTO", query, flags=re.IGNORECASE)
        query = re.sub(r"DATE_SUB\(CURDATE\(\),\s*INTERVAL\s*6\s*MONTH\)", "DATE('now', '-6 month')", query, flags=re.IGNORECASE)
        
        if params is not None and not isinstance(params, (list, tuple, dict)):
            params = (params,)
            
        if params is None:
            return self._cursor.execute(query)
        return self._cursor.execute(query, params)

    def executemany(self, query, seq_of_params):
        query = re.sub(r"CURDATE\(\)", "DATE('now')", query, flags=re.IGNORECASE)
        query = re.sub(r"NOW\(\)", "DATETIME('now')", query, flags=re.IGNORECASE)
        query = re.sub(r"INSERT IGNORE INTO", "INSERT OR IGNORE INTO", query, flags=re.IGNORECASE)
        return self._cursor.executemany(query, seq_of_params)

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        return MySQLRow(self._cursor.description, row)

    def fetchall(self):
        rows = self._cursor.fetchall()
        desc = self._cursor.description
        if not desc:
            return []
        return [MySQLRow(desc, row) for row in rows]

    def __iter__(self):
        return self

    def __next__(self):
        row = self._cursor.fetchone()
        if row is None:
            raise StopIteration
        return MySQLRow(self._cursor.description, row)

    def close(self):
        return self._cursor.close()

    @property
    def lastrowid(self):
        return self._cursor.lastrowid

    def __getattr__(self, name):
        return getattr(self._cursor, name)

class SQLiteConnectionWrapper:
    def __init__(self, conn):
        self._conn = conn
        self.row_factory = None
        self._conn.create_function("DATE_FORMAT", 2, _sqlite_date_format)
        self._conn.create_function("YEAR", 1, _sqlite_year)
        self._conn.create_function("MONTH", 1, _sqlite_month)

    def cursor(self):
        return SQLiteCursorWrapper(self._conn.cursor())

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

def get_db_conn(db_name: str = "yatra_agency"):
    """
    Connect to MySQL if available, with automatic fallback to SQLite if MySQL is unreachable.
    """
    config = MYSQL_CONFIG.copy()
    config['database'] = db_name
    try:
        conn = pymysql.connect(**config)
        return MySQLConnectionWrapper(conn)
    except Exception as e:
        # Fallback to local SQLite database when MySQL is unavailable
        db_path = os.path.join(str(BACKEND_DIR), f"{db_name}.db")
        conn = sqlite3.connect(db_path, isolation_level=None)  # autocommit mode
        return SQLiteConnectionWrapper(conn)
