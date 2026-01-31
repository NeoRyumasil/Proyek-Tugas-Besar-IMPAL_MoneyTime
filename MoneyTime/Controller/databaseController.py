import psycopg2
import os

def db_connect():
    import psycopg2
import os

def db_connect():
    try:
        db_url = os.getenv('POSTGRES_URL')
        
        if db_url:
            connection = psycopg2.connect(db_url, sslmode="require")
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
        return None