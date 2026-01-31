import psycopg2
import os

def db_connect():
    
    try:
        connection = psycopg2.connect(
            host=os.getenv('POSTGRES_HOST'),
            user=os.getenv('POSTGRES_USER'),
            password=os.getenv('POSTGRES_PASSWORD'),
            dbname=os.getenv('POSTGRES_DATABASE'),
            port="5432",
            sslmode="require"
        )
        return connection
    
    except Exception as e:
        print(f"Gagal koneksi ke Database: {e}")
        return None