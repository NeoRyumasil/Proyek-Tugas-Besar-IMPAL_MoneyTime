from typing import List, Tuple
from Controller.databaseController import db_connect

class Pemasukkan():
    
        # Membuat Pemasukkan
        def create_Pemasukkan(self, finansial_id : int, deskripsi : str, nominal : int, tanggal : str) -> bool :
            conn = db_connect()

            try:
                conn.table("Pemasukkan").insert({
                    "finansialid": finansial_id,
                    "deskripsi": deskripsi,
                    "nominal": nominal,
                    "tanggal": tanggal
                }).execute()
                return True
            
            except Exception as error:
                print(f"Error buat Pemasukkan: {error}")
                return False
        
        # Ambil semua Pemasukkan user
        def get_all_Pemasukkan_user(self, user_id : str, keyword : str = None) -> List[Tuple]:
            conn = db_connect()

            try:
                result_query = conn.table("Pemasukkan").select(
                    "pemasukkanid, deskripsi, nominal, tanggal, Finansial(kategori, userid)"
                )

                result_query = result_query.eq("Finansial.userid", user_id)

                result = result_query.execute()

                results = []

                for row in result.data:
                    if row["Finansial"]:
                        kategori = row["Finansial"]["kategori"]
                    else:
                        None
                    
                    if keyword:
                        keyword = keyword.lower()

                        if keyword not in (row['deskripsi'] or "").lower() and keyword not in (kategori or "").lower():
                            continue

                        results.append({
                            "pemasukkanid": row["pemasukkanid"],
                            "deskripsi": row["deskripsi"],
                            "nominal": row["nominal"],
                            "tanggal": row["tanggal"],
                            "kategori": row["kategori"],
                            "type": "Income"
                        })
                    
                return results
           
            except Exception as error:
                print(f"Error ambil Pemasukkan: {error}")
                return []

        # Hapus Pemasukkan
        def delete_Pemasukkan(self, transaction_id : int, user_id : str) -> bool:
            conn = db_connect()

            try:
                result = conn.table("Pemasukkan").select(
                    "pemasukkanid, Finansial(userid)"
                ).eq("pemasukkanid", transaction_id).execute()

                if not result.data or result.data[0]["Finansial"]["userid"] != user_id:
                    return False
                
                conn.table("Pemasukkan").delete().eq("pemasukkanid", transaction_id).execute()
                
                return True
            
            except Exception as error:
                print(f"Delete error: {error}")
                return False
            
        # Update Pemasukkan
        def update_Pemasukkan(self, transaction_id : int, user_id : str, deskripsi : str, nominal : int, tanggal : str, finansial_id : int) -> bool :
            conn = db_connect()

            try:
                result = conn.table("Pemasukkan").select(
                    "pemasukkanid, Finansial(userid)"
                ).eq("pemasukkanid", transaction_id).execute()

                if not result.data or result.data[0]["Finansial"]["userid"] != user_id:
                    return False
                
                conn.table("Pemasukkan").update({
                    "deskripsi": deskripsi,
                    "nominal": nominal,
                    "tanggal": tanggal,
                    "finansialid": finansial_id
                }).eq("pemasukkanid", transaction_id).execute()

                return True
            
            except Exception as error:
                print(f"Update Pemasukkan error: {error}")
                return False
           