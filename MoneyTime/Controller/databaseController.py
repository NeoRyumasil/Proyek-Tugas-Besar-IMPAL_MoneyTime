import psycopg2
import os
from urllib.parse import urlparse, urlunparse

def db_connect():
    try:
        db_url = os.getenv('POSTGRES_URL_NON_POOLING')
        
        if db_url:
            parsed = urlparse(db_url)
            clean_url = urlunparse(parsed._replace(query=""))
            connection = psycopg2.connect(clean_url, sslmode="require")
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