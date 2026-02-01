import os
from supabase import create_client, Client

def db_connect() -> Client:
    try:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_ANON_KEY')

        if not url or not key:
            print("Error URL atau KEY tidak ditemukan")
            return None
        
        return create_client(url, key)
    
    except Exception as error:
        print(f"Gagal terhubung ke database: {error}")
        return None


