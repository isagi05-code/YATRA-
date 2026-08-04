import os
import pymysql
import re
import decimal

# Load .env file into environment variables if available
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
if os.path.exists(_env_path):
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_path)
    except ImportError:
        with open(_env_path) as _f:
            for _line in _f:
                _line = _line.strip()
                if "=" in _line and not _line.startswith("#"):
                    _key, _, _val = _line.partition("=")
                    _val = _val.split("#")[0].strip()  # strip inline comments
                    os.environ.setdefault(_key.strip(), _val)

try:
    _port = int(os.getenv('MYSQL_PORT', 3307))
except ValueError:
    _port = 3307

MYSQL_CONFIG = {
    'host': os.getenv('MYSQL_HOST', 'localhost'),
    'port': _port,
    'user': os.getenv('MYSQL_USER', 'root'),
    'password': os.getenv('MYSQL_PASSWORD', '1234'),
    'charset': 'utf8mb4',
    'autocommit': True
}

# Handle SSL if configured
_mysql_ssl = os.getenv('MYSQL_SSL', 'false').lower()
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
        # 1. Translate ? placeholders to %s
        query = query.replace('?', '%s')
        
        # 2. Escape literal % signs (e.g. in DATE_FORMAT '%b') if params are passed to PyMySQL
        if params is not None:
            query = re.sub(r'%(?!s)', r'%%', query)
        
        # 3. Translate SQLite functions
        query = re.sub(r"DATE\('now'\)", "CURDATE()", query, flags=re.IGNORECASE)
        query = re.sub(r"datetime\('now'\)", "NOW()", query, flags=re.IGNORECASE)
        
        # 4. Handle single parameters (non-iterable parameter conversion)
        if params is not None and not isinstance(params, (list, tuple, dict)):
            params = (params,)
            
        return self._cursor.execute(query, params)

    def executemany(self, query, seq_of_params):
        query = query.replace('?', '%s')
        query = re.sub(r'%(?!s)', r'%%', query)
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
        self.row_factory = None  # To mimic sqlite3.Connection.row_factory

    def cursor(self):
        return MySQLCursorWrapper(self._conn.cursor())

    def commit(self):
        pass  # PyMySQL autocommit is enabled, so commit is a no-op

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

def get_db_conn(db_name: str):
    config = MYSQL_CONFIG.copy()
    config['database'] = db_name
    conn = pymysql.connect(**config)
    return MySQLConnectionWrapper(conn)
