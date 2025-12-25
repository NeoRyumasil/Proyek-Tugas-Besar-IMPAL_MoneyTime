import pymssql
import os

def db_connect():
    try:
        # Koneksi menggunakan pymssql (tidak butuh driver ODBC di Vercel)
        connection = pymssql.connect(
            server=os.getenv('DB_SERVER'),
            user=os.getenv('DB_USERNAME'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_DATABASE'),
            port=1433,
            timeout=30
        )
        return connection
    except Exception as e:
        print(f"Gagal koneksi ke Azure SQL: {e}")
        return None

# Contoh query untuk mengambil data dari tabel 'user'
#sql = ''' SELECT * FROM [dbo].[user] '''

# Eksekusi query dan mengambil data
#cursor = connection.cursor()
#cursor.execute(sql)

# Menampilkan data yang diambil
#data = cursor.fetchall()
#print(data)