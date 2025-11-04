from Model.user import User          
from Controller.databaseController import db_connect

class UserController:
    def __init__(self):
        self.current_user = None  

    def login(self, username: str, email: str, password: str):
        try:
            # Koneksi dan verifikasi user dari database
            conn = db_connect()
            cursor = conn.cursor()
            sql = "SELECT id, username, email FROM [dbo].[User] WHERE (email = ? AND password = ?) OR (username = ? AND password = ?)"
            cursor.execute(sql, (email, password, username, password))
            user = cursor.fetchone()

            # Kalau user ketemu, buat objek user
            if user:
                self.current_user = User(user_id=user[0], username=user[1], password=password, email_address=user[2])
                return True
            else:
                return False
        except Exception as e:
            print("Error saat login:", e)
            return False
        finally:
            # Kalau udah ada koneksi, tutup koneksi
            if 'conn' in locals():
                conn.close()

    def registrasi(self, username: str, password: str, email: str):
        try:
            # Koneksi dan simpan user ke database
            conn = db_connect()
            cursor = conn.cursor()
            sql = "INSERT INTO [dbo].[User] (username, password, email, role) VALUES (?, ?, ?, 'user')"
            cursor.execute(sql, (username, password, email))
            conn.commit()
            print(f"User {username} berhasil terdaftar dengan email {email}.")
            return True
        except Exception as e:
            print("Error saat registrasi:", e)
            return False
        finally:
            # Kalau udah ada koneksi, tutup koneksi
            if 'conn' in locals():
                conn.close()

    def logout(self):
        if self.current_user:
            print(f"User {self.current_user.username} telah logout.")
            self.current_user = None
        else:
            print("Tidak ada user yang login.")

    def get_current_user(self):
        return self.current_user
