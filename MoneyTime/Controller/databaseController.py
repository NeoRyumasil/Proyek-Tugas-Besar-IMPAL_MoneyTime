import psycopg2
import os

def db_connect():
    import psycopg2
import os

import psycopg2
import os
from urllib.parse import urlparse, urlunparse

def db_connect():
    try:
        db_url = os.getenv('POSTGRES_URL')
        
        if db_url:
            parsed = urlparse(db_url)
            clean_url = urlunparse(parsed._replace(query=""))
            connection = psycopg2.connect(clean_url, sslmode="require")

        else:
            connection = psycopg2.connect(
                host=os.getenv('POSTGRES_HOST'),
                user=os.getenv('POSTGRES_USER'),
                password=os.getenv('POSTGRES_PASSWORD'),
                dbname=os.getenv('POSTGRES_DATABASE'),
                port=os.getenv('DB_PORT', "5432"),
                sslmode="require"
            )
        
        return connection
    
    except Exception as e:
        print(f"Gagal koneksi ke Database: {e}")