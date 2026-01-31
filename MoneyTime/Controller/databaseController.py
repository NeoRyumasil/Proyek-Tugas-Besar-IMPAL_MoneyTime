import psycopg2
import os
from urllib.parse import urlparse, urlunparse

def db_connect():
    try:
        password = os.getenv('POSTGRES_PASSWORD')
        db_url = f"postgresql://postgres:{password}@db.ocugskvqpuixwbblrpcf.supabase.co:5432/postgres"
        
        if db_url:
            connection = psycopg2.connect(db_url, sslmode="require")
            return connection
            
        else:
            return psycopg2.connect(
                host=os.getenv('POSTGRES_HOST'),
                user=os.getenv('POSTGRES_USER'),
                password=os.getenv('POSTGRES_PASSWORD'),
                dbname=os.getenv('POSTGRES_DATABASE'),
                port="5432",
                sslmode="require"
            )
    
    except Exception as e:
        print(f"Gagal koneksi ke Database: {e}")
        return None