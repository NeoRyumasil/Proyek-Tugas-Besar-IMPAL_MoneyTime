from Controller.credentials import username, password, server, database

import pymssql
import os

def db_connect():
    # Mengambil data kredensial dari Environment Variables Vercel
    server = server
    database = database
    username = username
    password = password

    try:
        # Koneksi menggunakan pymssql (tidak butuh driver ODBC di Vercel)
        connection = pymssql.connect(
            server=server,
            user=username,
            password=password,
            database=database,
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