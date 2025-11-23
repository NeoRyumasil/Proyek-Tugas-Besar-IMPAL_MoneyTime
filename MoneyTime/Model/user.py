from Controller.databaseController import db_connect

class User ():
    def __init__(self, user_id: str, username: str, password: str, email_address: str):
        self.__user_id = user_id
        self.username = username
        self.password = password
        self.email_address = email_address

    def get_user_id(self):
        return self.__user_id

    def set_user_id(self, new_id: str):
        self.__user_id = new_id

    def registrasi(self):
        print(f"User {self.username} berhasil terdaftar dengan email {self.email_address}.")

    def login(self, username: str, password: str):
        if self.username == username and self.password == password:
            print("Login berhasil!")
            return True
        else:
            print("Username atau password salah.")
            return False

    def lupa_password(self, email: str):
        if self.email_address == email:
            print("Link reset password telah dikirim ke email Anda.")
        else:
            print("Email tidak ditemukan.")

    def cari_kategori_aktivitas(self, kategori: str):
        print(f"Mencari aktivitas dengan kategori: {kategori}")

    def tampilan_aktivitas_dan_finansial(self):
        print(f"Menampilkan data aktivitas dan finansial untuk user {self.username}.")
