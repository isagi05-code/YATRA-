import os
import pymysql
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

    def __contains__(self, key):
        return key in self._mapping

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
            if '?' in query:
                query = query.replace('%', '%%').replace('?', '%s')
            if not isinstance(params, (list, tuple, dict)):
                params = (params,)
        else:
            if '?' in query:
                query = query.replace('?', '%s')
        
        # Translate SQLite date functions
        query = re.sub(r"DATE\('now'\)", "CURDATE()", query, flags=re.IGNORECASE)
        query = re.sub(r"datetime\('now'\)", "NOW()", query, flags=re.IGNORECASE)
            
        return self._cursor.execute(query, params)

    def executemany(self, query, seq_of_params):
        if '?' in query:
            query = query.replace('%', '%%').replace('?', '%s')
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

MYSQL_CONFIG['database'] = setting('MYSQL_DATABASE', 'yatra_enterprise')

def get_db_conn(db_name: str = "yatra_enterprise") -> MySQLConnectionWrapper:
    """
    Connect directly to MySQL database with autocommit enabled.
    Raises exception on failure.
    """
    config = MYSQL_CONFIG.copy()
    config['database'] = db_name or "yatra_enterprise"
    conn = pymysql.connect(**config)
    return MySQLConnectionWrapper(conn)


