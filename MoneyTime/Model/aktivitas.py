from Controller.databaseController import db_connect

class Aktivitas():
    def __init__(self):
        pass

    # Buat Aktivitas
    def create_activity(self, user_id, title, description, tenggat_waktu, time, category, priority):
        conn = db_connect()

        try:
            conn.table("Aktivitas").insert({
                "userid": user_id,
                "nama_aktivitas": title,
                "deskripsi": description,
                "tenggat": tenggat_waktu,
                "waktu": time,
                "kategori": category,
                "prioritas": priority,
                "status": "Pending"
            }).execute()

            return True
        
        except Exception as error:
            print(f"Error membuat aktivitas: {error}")
            return False
        
    # Cari Aktivitas User
    def get_user_activity(self, user_id):
        conn = db_connect()

        try:
            result = conn.table("Aktivitas").select(
                "aktivitasid, nama_aktivitas, deskripsi, tenggat, waktu, kategori, prioritas, status"
            ).eq("userid", user_id).execute

            return result.data
        

        except Exception as error:
            print(f"Error ngambil aktivitas: {error}")
            return []

    # Update Status Aktivitas
    def update_status(self, aktivitas_id, status):
        conn = db_connect()

        try:
            conn.table("Aktivitas").update({
                "status": status
            }).eq("aktivitasid", aktivitas_id).execute()

            return True
        
        except Exception as error:
            print(f"Error update status: {error}")
            return False
    
    # Update Aktivitas
    def update_activity(self, aktivitas_id, title, description, tenggat_waktu, time, category, priority):
        conn = db_connect()

        try:
            conn.table("Aktivitas").update({
                "nama_aktivitas": title,
                "deskripsi": description,
                "tenggat": tenggat_waktu,
                "waktu": time,
                "kategori": category,
                "prioritas": priority
            }).eq("aktivitasid", aktivitas_id).execute()

            return True
        
        except Exception as error:
            print(f"Error Update Aktivitas: {error}")
            return False

    # Hapus Aktivitas
    def delete_activity(self, aktivitas_id):
        conn = db_connect()

        try:
            conn.table("Aktivitas").delete().eq("aktivitasid", aktivitas_id).execute()
            return True
        
        except Exception as error:
            print(f"Error Delete Aktivitas: {error}")
            return False
    
    # Cari Kategori
    def get_category(self, user_id):
        conn = db_connect()

        try:
            result = conn.table("Aktivitas").select("kategori").eq("userid", user_id).execute()
            kategori = list(set(row["kategori"] for row in result.data if row["kategori"]))
            return kategori
        
        except Exception as error:
            print(f"Error Cari Kategori: {error}")
            return []
    