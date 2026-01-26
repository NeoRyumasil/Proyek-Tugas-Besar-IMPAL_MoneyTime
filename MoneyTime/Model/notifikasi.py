from Controller.databaseController import db_connect

class Notifikasi():
    def __init__(self):
        pass

    # Ambil Notifikasi yang pending
    def get_pending_notifications(self, user_id):

        try:
            conn = db_connect()
            cursor = conn.cursor
            sql = """
                SELECT NamaAktivitas, Deskripsi, Tenggat, Kategori, Waktu, AktivitasID, IsRead
                FROM [dbo].[Aktivitas]
                WHERE UserID = %s AND Status = 'Pending'
                ORDER BY Tenggat ASC
            """
            cursor.execute(sql, (user_id))
            rows = cursor.fetchall()
            return rows
        
        except Exception as error:
            print(f"Error mendapatkan notifikasi: {error}")
            return []
        
        finally:
            conn.close()
    
    # Update Mark
    def update_mark_read(self, aktivitas_id):

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                UPDATE [dbo].[Aktivitas]
                SET IsRead = 1 WHERE AktivitasID = %s
            """
            cursor.execute(sql, (aktivitas_id))
            conn.commit()
            return cursor.rowcount > 0
        
        except Exception as error:
            print(f"Error update mark : {error}")
            return False
        
        finally:
            conn.close()

    # Update All
    def update_all_mark_read(self, user_id):

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = "UPDATE [dbo].[Aktivitas] SET IsRead = 1 WHERE UserID = %s"
            cursor.execute(sql, (user_id))
            conn.commit()
            return True

        except Exception as error:
            print(f"Error Update All Mark : {error}") 
            return False

        finally:
            conn.close()

    # Update Toggle
    def update_toggle(self, aktivitas_id):

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                UPDATE [dbo].[Aktivitas]
                SET IsRead = CASE WHEN IsRead = 1 THEN 0 ELSE 1 END
                OUTPUT INSERTED.IsRead
                WHERE AktivitasID = %s
            """   
            cursor.execute(sql, (aktivitas_id))
            result = cursor.fetchone()
            conn.commit()

            if result:
                return True, result[0]
            
            return False, None
        
        except Exception as error:
            print(f"Error Update Toggle: {error}")
            return False, None
        
        finally:
            conn.close()
    
    # Ambil Email User
    def get_email_user(self, user_id):

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = "SELECT email FROM [dbo].[User] WHERE id = %s"
            cursor.execute(sql, (user_id))
            result = cursor.fetchone()

            if result:
                return result[0]
            
            return None
        
        except Exception as error:
            print(f"Error ambil email user: {error}")
            return None

        finally:
            conn.close()