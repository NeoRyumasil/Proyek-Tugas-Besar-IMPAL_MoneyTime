from Model.user import User          # pastikan path sesuai struktur project kamu
from Controller.databaseController import db_connect

class UserController:
    def __init__(self):
        self.current_user = None  # Menyimpan user yang sedang login

    def login(self, email: str, password: str):
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = "SELECT id, username, email FROM [dbo].[User] WHERE email = ? AND password = ?"
            cursor.execute(sql, (email, password))
            user = cursor.fetchone()

            if user:
                self.current_user = User(user_id=user[0], username=user[1], password=password, email_address=user[2])
                return True
            else:
                return False
        except Exception as e:
            print("Error saat login:", e)
            return False
        finally:
            if 'conn' in locals():
                conn.close()

    def logout(self):
        """
        Logout user saat ini.
        """
        if self.current_user:
            print(f"User {self.current_user.username} telah logout.")
            self.current_user = None
        else:
            print("Tidak ada user yang login.")

    def get_current_user(self):
        """
        Mengembalikan data user yang sedang login.
        """
        return self.current_user
