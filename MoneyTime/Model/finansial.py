from typing import Optional
from Controller.databaseController import db_connect

class Finansial():
    
    # Cari data User dan Kategori
    def get_user_and_category(self, user_id : str, kategori : str) -> Optional[int]:

        try :
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                SELECT FinansialID FROM [dbo].[Finansial]
                WHERE UserID = %s AND Kategori = %s
            """
            cursor.execute(sql, (user_id, kategori))
            row = cursor.fetchone()
            if row :
                return int(row[0])
            else:
                return None
        
        except Exception as error:
            print(f"Error get user dan kategori: {error}")
            return None
        
        finally:
            conn.close()
        
    # Buat Data Finansial
    def create_financial(self, user_id : str, kategori : str, budget : int = 0, status : str = 'active') -> Optional[int]:

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                INSERT INTO [dbo].[Finansial] (UserID, budget, kategori, status)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (user_id, budget, kategori, status))
            conn.commit()

            sql = """
                SELECT TOP 1 FinansialID FROM [dbo].[Finansial]
                WHERE UserID = %s AND kategori = %s 
                ORDER BY FinansialID DESC
            """
            cursor.execute(sql, (user_id, kategori))
            row = cursor.fetchone()

            if row :
                return int(row[0])
            else :
                return None
        
        except Exception as error :
            print(f"Error buat Finansial: {error}")
            return None
        
        finally:
            conn.close()