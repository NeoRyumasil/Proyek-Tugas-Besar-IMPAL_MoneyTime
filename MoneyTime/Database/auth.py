import pypyodbc as odbc
from credentials import username, password, server, database

# Membuat koneksi ke database SQL Server menggunakan pypyodbc
def db_connect():
    connection_string = f'DRIVER={{ODBC Driver 18 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;'
    connection = odbc.connect(connection_string)
    return connection

# Contoh query untuk mengambil data dari tabel 'user'
#sql = ''' SELECT * FROM [dbo].[user] '''

# Eksekusi query dan mengambil data
#cursor = connection.cursor()
#cursor.execute(sql)

# Menampilkan data yang diambil
#data = cursor.fetchall()
#print(data)