import psycopg2
import os
from urllib.parse import urlparse, urlunparse

def db_connect():
    try:
        db_url = os.getenv('POSTGRES_URL_NON_POOLING')

        if db_url:
            parsed = urlparse(db_url)
            hostname = parsed.hostname or ""
            if "pooler.supabase.com" in hostname:
                prefix = hostname.split(".pooler.supabase.com")[0]
                new_hostname = f"{prefix}.supabase.co"
                parsed = parsed._replace(
                    netloc=f"{parsed.username}:{parsed.password}@{new_hostname}:{parsed.port or 5432}"
                )
                print(f"[INFO] Hostname diganti dari pooler ke direct: {new_hostname}")

            clean_url = urlunparse(parsed._replace(query=""))
            connection = psycopg2.connect(clean_url, sslmode="require")
            return connection

        else:
            host = os.getenv('POSTGRES_HOST') or ""
            user = os.getenv('POSTGRES_USER')
            password = os.getenv('POSTGRES_PASSWORD')
            dbname = os.getenv('POSTGRES_DATABASE')
            port = os.getenv('POSTGRES_PORT', '5432')

            if "pooler.supabase.com" in host:
                prefix = host.split(".pooler.supabase.com")[0]
                host = f"{prefix}.supabase.co"
                print(f"[INFO] Host diganti dari pooler ke direct: {host}")

            connection = psycopg2.connect(
                host=host,
                user=user,
                password=password,
                dbname=dbname,
                port=port,
                sslmode="require"
            )
            return connection

    except Exception as e:
        print(f"Gagal koneksi ke Database: {e}")
        return None
