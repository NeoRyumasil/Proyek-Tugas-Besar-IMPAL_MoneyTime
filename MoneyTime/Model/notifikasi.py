from Controller.databaseController import db_connect

class Notifikasi():
    def __init__(self):
        pass

    # Ambil Notifikasi yang pending
    def get_pending_notifications(self, user_id):
        conn = db_connect()

        try:
            result = conn.table("Aktivitas").select(
                "nama_aktivitas, deskripsi, tenggat, kategori, waktu, aktivitasid, isread"
            ).eq("userid", user_id).eq("status", "Pending").order("tenggat", desc=False).execute()

            return result.data
        
        except Exception as error:
            print(f"Error mendapatkan notifikasi: {error}")
            return []
        
    # Update Mark
    def update_mark_read(self, aktivitas_id):
        conn = db_connect()

        try:
            result = conn.table("Aktivitas").update({
                "isread": 1
            }).eq("aktivitasid", aktivitas_id).execute()
            
            return len(result.data) > 0
        
        except Exception as error:
            print(f"Error update mark: {error}")
            return False
    
    # Update All
    def update_all_mark_read(self, user_id):
        conn = db_connect()

        try:
            conn.table("Aktivitas").update({
                "isread": 1
            }).eq("userid", user_id).execute()
            
            return True
        
        except Exception as error:
            print(f"Error Update All Mark: {error}")
            return False

    # Update Toggle
    def update_toggle(self, aktivitas_id):
        conn = db_connect()

        try:
            result = conn.table("Aktivitas").select("isread").eq("aktivitasid", aktivitas_id).execute()

            if not result.data:
                return False, None
            
            current_value = result.data[0]["isread"]
            new_value = not current_value

            conn.table("Aktivitas").update({
                "isread": new_value
            }).eq("aktivitasid", aktivitas_id).execute()

            return True, new_value
        
        except Exception as error:
            print(f"Error update toggle: {error}")
            return False, None
    
    # Ambil Email User
    def get_email_user(self, user_id):
        conn = db_connect()

        try:
            result = conn.table("User").select("email").eq("id", user_id).execute()

            if result.data:
                return result.data[0]["email"]
            
            return None
        
        except Exception as error:
            print(f"Error ambil email user: {error}")