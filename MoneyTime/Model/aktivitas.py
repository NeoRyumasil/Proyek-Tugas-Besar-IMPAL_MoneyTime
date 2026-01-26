from Controller.databaseController import db_connect
from datetime import datetime

class Aktivitas():
    def __init__(self):
        pass

    # Buat Aktivitas
    def create_activity(self, user_id, title, description, tenggat_waktu, time, category, priority):
        
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                    INSERT INTO Aktivitas
                    (UserID, Nama_Aktivitas, Deskripsi, Tenggat, Waktu, Kategori, Prioritas, Status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending')
            """
            cursor.execute(sql, (user_id, title, description, tenggat_waktu, time, category, priority))
            conn.commit()
            return True

        except Exception as error:
            print(f"Error dalam membuat aktivitas: {error}")
            return False
        
        finally:
            conn.close()
        
    # Cari Aktivitas User
    def get_user_activity(self, user_id):

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                SELECT AktivitasID, Nama_Aktivitas, Deskripsi, Tenggat, Waktu, Kategori, Prioritas, Status
                FROM Aktivitas
                WHERE UserID = %s
            """
            cursor.execute(sql, (user_id,))
            return cursor.fetchall()
        
        except Exception as error:
            print(f"Error ambil aktivitas: {error}")
            return[]
        
        finally:
            conn.close()

    # Update Status Aktivitas
    def update_status(self, aktivitas_id, status):
        
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                UPDATE Aktivitas
                SET Status = %s 
                WHERE AktivitasID = %s
            """
            cursor.execute(sql, (status, aktivitas_id))
            conn.commit()
            return True
        
        except Exception as error:
            print(f"Error Update Status: {error}")
            return False
        
        finally:
            conn.close()
    
    # Update Aktivitas
    def update_activity(self, aktivitas_id, title, description, tenggat_waktu, time, category, priority):

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                UPDATE Aktivitas
                SET Nama_Aktivitas = %s,
                    Deskripsi = %s,
                    Tenggat = %s,
                    Waktu = %s,
                    Kategori = %s,
                    Prioritas = %s
                WHERE AktivitasID = %s
            """
            cursor.execute(sql, (title, description, tenggat_waktu, time, category, priority, aktivitas_id))
            conn.commit()
            return True
        
        except Exception as error:
            print(f"Error update aktivitas: {error}")
            return False
        
        finally:
            conn.close()

    # Hapus Aktivitas
    def delete_activity(self, aktivitas_id):
        
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                DELETE FROM Aktivitas
                WHERE AktivitasID = %s
            """
            cursor.execute(sql, (aktivitas_id,))
            conn.commit()
            return True
        
        except Exception as error:
            print(f"Error delete aktivitas: {error}")
            return False
        
        finally:
            conn.close()
    
    # Cari Kategori
    def get_category(self, user_id):

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                SELECT DISTINCT Kategori FROM Aktivitas
                WHERE UserID = %s
            """
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()
            return rows
        
        except Exception as error:
            print(f"Error Cari Kategori: {error}")
            return[]
        
        finally:
            conn.close()
    