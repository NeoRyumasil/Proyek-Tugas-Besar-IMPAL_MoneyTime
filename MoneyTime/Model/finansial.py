from typing import Optional
from Controller.databaseController import db_connect

class Finansial():
    
    # Cari data User dan Kategori
    def get_user_and_category(self, user_id : str, kategori : str) -> Optional[int]:
        conn = db_connect()

        try:
            result = conn.table("Finansial").select("finansialid").eq("userid", user_id).eq("kategori", kategori).execute()

            if result.data:
                return int(result.data[0]["finansialid"])
            
            return None
        
        except Exception as error:
            print(f"Error mendapatkan user dan kategori: {error}")
            return None

    # Buat Data Finansial
    def create_financial(self, user_id : str, kategori : str, budget : int = 0, status : str = 'active') -> Optional[int]:
        conn = db_connect()

        try:
            result = conn.table("Finansial").insert({
                "userid": user_id,
                "budget": budget,
                "kategori": kategori,
                "status": status
            }).execute()

            if result.data:
                return int(result.data[0]["finansialid"])
            
            return None
        
        except Exception as error:
            print(f"Error buat Finansial: {error}")
            return None