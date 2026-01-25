from typing import List, Tuple, Any
from Controller.databaseController import db_connect

class Pengeluaran():
    
    # Membuat Pengeluaran
    def create_Pengeluaran(self, finansial_id : int, deskripsi : str, nominal : int, tanggal : str) -> bool :

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                INSERT INTO [dbo].[Pengeluaran] (FinansialID, deskripsi, nominal, tanggal)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (finansial_id, deskripsi, nominal, tanggal))
            conn.commit()
            return True
        
        except Exception as error:
            print(f"Error buat Pengeluaran : {error}")
        
        finally:
            conn.close()
    
    # Ambil semua Pengeluaran user
    def get_all_Pengeluaran_user(self, user_id : str, keyword : str = None) -> List[Tuple]:

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                SELECT p.PengeluaranID, p.deskripsi, p.nominal, f.kategori, 'Expense'
                FROM [dbo].[Pengeluaran] p 
                JOIN [dbo].[Finansial] f ON p.FinansialID = f.FinansialID
                WHERE f.UserID = %s
            """
            parameter = [user_id]

            if keyword:
                sql += "AND (p.deskripis LIKE %s OR f.kategori LIKE %s)"
                parameter.extend([f"%{keyword}%", f"%{keyword}%"])
            
            cursor.execute(sql, tuple(parameter))
            return cursor.fetchall()
        
        except Exception as error:
            print(f"Error Ambil Pengeluaran: {error}")
            return []
        
        finally:
            conn.close()

    # Hapus Pengeluaran
    def delete_Pengeluaran(self, transaction_id : int, user_id : str) -> bool:

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                DELETE p FROM [dbo].[Pengeluaran] p
                JOIN [dbo].[Finansial] f ON p.FinasialID = f.FinansialID
                WHERE p.PengeluaranID = %s AND f.UserID = %s
            """
            cursor.execute(sql, (transaction_id, user_id))
            conn.commit()
            return cursor.rowcount > 0
        
        except Exception as error:
            print(f"Delete Error : {error}")
            return False
        
        finally:
            conn.close()
    
    # Update Pengeluaran
    def update_Pengeluaran(self, transaction_id : int, user_id : str, deskripsi : str, nominal : int, tanggal : str, finansial_id : int) -> bool :

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                UPDATE p SET p.deskripsi = %s, p.nominal = %s, p.Tanggal = %s, p.FinansialID = %s
                FROM [dbo].[Pengeluaran] p
                JOIN [dbo].[Finansial] f ON p.FinansialID = f.FinansialID
                WHERE p.PengeluaranID = %s AND f.UserID = %s
            """
            cursor.execute(sql, (deskripsi, nominal, tanggal, finansial_id, transaction_id, user_id))
            conn.commit()
            return cursor.rowcount > 0
        
        except Exception as error:
            print(f"Update Pengeluaran Error : {error}")
            return False
        
        finally:
            conn.close()
    
    