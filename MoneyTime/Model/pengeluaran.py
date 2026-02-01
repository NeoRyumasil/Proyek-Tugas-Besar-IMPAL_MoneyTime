from typing import List, Tuple
from Controller.databaseController import db_connect

class Pengeluaran():
    
        # Membuat pengeluaran
        def create_Pengeluaran(self, finansial_id : int, deskripsi : str, nominal : int, tanggal : str) -> bool :
            conn = db_connect()

            try:
                conn.table("Pengeluaran").insert({
                    "finansialid": finansial_id,
                    "deskripsi": deskripsi,
                    "nominal": nominal,
                    "tanggal": tanggal
                }).execute()
                return True
            
            except Exception as error:
                print(f"Error buat pengeluaran: {error}")
                return False
        
        # Ambil semua pengeluaran user
        def get_all_Pengeluaran_user(self, user_id : str, keyword : str = None) -> List[Tuple]:
            conn = db_connect()

            try:
                result_query = conn.table("Pengeluaran").select(
                    "pengeluaranid, deskripsi, nominal, tanggal, Finansial(kategori, userid)"
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
                        "pengeluaranid": row["pengeluaranid"],
                        "deskripsi": row["deskripsi"],
                        "nominal": row["nominal"],
                        "tanggal": row["tanggal"],
                        "kategori": row["kategori"],
                        "type": "Expense"
                    })
                
                return results
           
            except Exception as error:
                print(f"Error ambil pengeluaran: {error}")
                return []

        # Hapus pengeluaran
        def delete_Pengeluaran(self, transaction_id : int, user_id : str) -> bool:
            conn = db_connect()

            try:
                result = conn.table("Pengeluaran").select(
                    "pengeluaranid, Finansial(userid)"
                ).eq("pengeluaranid", transaction_id).execute()

                if not result.data or result.data[0]["Finansial"]["userid"] != user_id:
                    return False
                
                conn.table("Pengeluaran").delete().eq("pengeluaranid", transaction_id).execute()
                
                return True
            
            except Exception as error:
                print(f"Delete error: {error}")
                return False
            
        # Update pengeluaran
        def update_Pengeluaran(self, transaction_id : int, user_id : str, deskripsi : str, nominal : int, tanggal : str, finansial_id : int) -> bool :
            conn = db_connect()

            try:
                result = conn.table("Pengeluaran").select(
                    "pengeluaranid, Finansial(userid)"
                ).eq("pengeluaranid", transaction_id).execute()

                if not result.data or result.data[0]["Finansial"]["userid"] != user_id:
                    return False
                
                conn.table("Pengeluaran").update({
                    "deskripsi": deskripsi,
                    "nominal": nominal,
                    "tanggal": tanggal,
                    "finansialid": finansial_id
                }).eq("pengeluaranid", transaction_id).execute()

                return True
            
            except Exception as error:
                print(f"Update pengeluaran error: {error}")
                return False
           