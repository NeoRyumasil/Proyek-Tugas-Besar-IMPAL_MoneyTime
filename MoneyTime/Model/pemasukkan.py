from typing import List, Tuple, Any
from Controller.databaseController import db_connect

class Pemasukkan():
    
    # Membuat Pemasukkan
    def create_pemasukkan(self, finansial_id : int, deskripsi : str, nominal : int, tanggal : str) -> bool :

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                INSERT INTO "Pemasukkan" ("finansialid", "deskripsi", "nominal", "tanggal")
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(sql, (finansial_id, deskripsi, nominal, tanggal))
            conn.commit()
            return True
        
        except Exception as error:
            print(f"Error buat pemasukkan : {error}")
        
        finally:
            conn.close()
    
    # Ambil semua pemasukkan user
    def get_all_pemasukkan_user(self, user_id : str, keyword : str = None) -> List[Tuple]:

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                SELECT p."pemasukkanid", p."deskripsi", p."nominal", f."kategori", 'Income'
                FROM "Pemasukkan" p 
                JOIN "Finansial" f ON p."finansialid" = f."finansialid"
                WHERE f."userid" = %s
            """
            parameter = [user_id]

            if keyword:
                sql += """
                    "AND (p."deskripsi" ILIKE %s OR f."kategori" ILIKE %s)"
                """
                parameter.extend([f"%{keyword}%", f"%{keyword}%"])
            
            cursor.execute(sql, tuple(parameter))
            return cursor.fetchall()
        
        except Exception as error:
            print(f"Error Ambil Pemasukkan: {error}")
            return []
        
        finally:
            conn.close()

    # Hapus Pemasukkan
    def delete_pemasukkan(self, transaction_id : int, user_id : str) -> bool:

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                DELETE FROM "Pemasukkan" p
                USING "Finansial" f
                WHERE p."finansialid" = f."finansialid"
                AND p."pemasukkanid" = %s AND f."userid" = %s
            """
            cursor.execute(sql, (transaction_id, user_id))
            conn.commit()
            return cursor.rowcount > 0
        
        except Exception as error:
            print(f"Delete Error : {error}")
            return False
        
        finally:
            conn.close()
    
    # Update Pemasukkan
    def update_pemasukkan(self, transaction_id : int, user_id : str, deskripsi : str, nominal : int, tanggal : str, finansial_id : int) -> bool :

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                UPDATE "Pemasukkan" p
                SET "deskripsi" = %s, "nominal" = %s, "tanggal" = %s, "finansialid" = %s
                FROM "Finansial" f
                WHERE p."finansialid" = f."finansialid"
                AND p."pemasukkanid" = %s AND f."userid" = %s
            """
            cursor.execute(sql, (deskripsi, nominal, tanggal, finansial_id, transaction_id, user_id))
            conn.commit()
            return cursor.rowcount > 0
        
        except Exception as error:
            print(f"Update Pemasukkan Error : {error}")
            return False
        
        finally:
            conn.close()
    
    