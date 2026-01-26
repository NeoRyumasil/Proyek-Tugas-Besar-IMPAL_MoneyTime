from typing import List, Tuple, Any
from Controller.databaseController import db_connect

class Pengeluaran():
    
        # Membuat pengeluaran
        def create_Pengeluaran(self, finansial_id : int, deskripsi : str, nominal : int, tanggal : str) -> bool :

            try:
                conn = db_connect()
                cursor = conn.cursor()
                sql = """
                    INSERT INTO "Pengeluaran" ("finansialid", "deskripsi", "nominal", "tanggal")
                    VALUES (%s, %s, %s, %s)
                """
                cursor.execute(sql, (finansial_id, deskripsi, nominal, tanggal))
                conn.commit()
                return True
            
            except Exception as error:
                print(f"Error buat pengeluaran : {error}")
            
            finally:
                conn.close()
        
        # Ambil semua pengeluaran user
        def get_all_Pengeluaran_user(self, user_id : str, keyword : str = None) -> List[Tuple]:

            try:
                conn = db_connect()
                cursor = conn.cursor()
                sql = """
                    SELECT p."pengeluaranid", p."deskripsi", p."nominal", f."kategori", 'Expense'
                    FROM "Pengeluaran" p 
                    JOIN "Finansial" f ON p."finansialid" = f."finansialid"
                    WHERE f."userid" = %s
                """
                parameter = [user_id]

                if keyword:
                    sql += """
                        AND (p."deskripsi" ILIKE %s OR f."kategori" ILIKE %s)
                    """
                    parameter.extend([f"%{keyword}%", f"%{keyword}%"])
                
                cursor.execute(sql, tuple(parameter))
                return cursor.fetchall()
            
            except Exception as error:
                print(f"Error Ambil pengeluaran: {error}")
                return []
            
            finally:
                conn.close()

        # Hapus pengeluaran
        def delete_Pengeluaran(self, transaction_id : int, user_id : str) -> bool:

            try:
                conn = db_connect()
                cursor = conn.cursor()
                sql = """
                    DELETE FROM "Pengeluaran" p
                    USING "Finansial" f
                    WHERE p."finansialid" = f."finansialid"
                    AND p."pengeluaranid" = %s AND f."userid" = %s
                """
                cursor.execute(sql, (transaction_id, user_id))
                conn.commit()
                return cursor.rowcount > 0
            
            except Exception as error:
                print(f"Delete Error : {error}")
                return False
            
            finally:
                conn.close()
        
        # Update pengeluaran
        def update_Pengeluaran(self, transaction_id : int, user_id : str, deskripsi : str, nominal : int, tanggal : str, finansial_id : int) -> bool :

            try:
                conn = db_connect()
                cursor = conn.cursor()
                sql = """
                    UPDATE "Pengeluaran" p
                    SET "deskripsi" = %s, "nominal" = %s, "tanggal" = %s, "finansialid" = %s
                    FROM "Finansial" f
                    WHERE p."finansialid" = f."finansialid"
                    AND p."pengeluaranid" = %s AND f."userid" = %s
                """
                cursor.execute(sql, (deskripsi, nominal, tanggal, finansial_id, transaction_id, user_id))
                conn.commit()
                return cursor.rowcount > 0
            
            except Exception as error:
                print(f"Update pengeluaran Error : {error}")
                return False
            
            finally:
                conn.close()
    
    