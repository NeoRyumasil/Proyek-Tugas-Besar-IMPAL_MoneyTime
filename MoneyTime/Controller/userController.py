from Model.user import User          
from Controller.databaseController import db_connect

# Import kredensial dari file credentials.py
from Controller.credentials import email_sender, email_password

# Import library untuk Email dan Random (Wajib ada agar tidak error)
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random
import os

# Library Hashing
from werkzeug.security import generate_password_hash, check_password_hash

# Flask
from flask import render_template

class UserController:
    def __init__(self):
        self.current_user = None  

    # --- METHOD LAMA (LOGIN, REGISTRASI, DLL) ---
    # (Pastikan kode login/regis lama Anda tetap ada di sini)

    def login(self, username, email, password):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            sql = """
                SELECT id, username, email, password
                FROM [dbo].[User]
                WHERE email = ? OR username = ?
            """

            cursor.execute(sql, (email, username))
            user = cursor.fetchone()

            if user:
                user_id, username, email, hashed_password = user
                
                # Verifikasi password menggunakan hashing
                if check_password_hash(hashed_password, password):
                    self.current_user = User(
                        user_id = user_id,
                        username = username,
                        password = hashed_password, 
                        email_address = email
                    )
                    print("Login berhasil!")
                    return True
                else:
                    print("Password salah.")
                    return False
            else:
                return False
            
        except Exception as e:
            print("Error saat login:", e)
            return False
        finally:
            if 'conn' in locals(): conn.close()

    def registrasi(self, username, password, email):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Check if username or email already exists
            check_sql = "SELECT COUNT(*) FROM [dbo].[User] WHERE username = ? OR email = ?"
            cursor.execute(check_sql, (username, email))
            count = cursor.fetchone()[0]
            
            if count > 0:
                print(f"User {username} atau email {email} sudah terdaftar.")
                return "exists"
              
            # Hashing password sebelum disimpan
            hashed_password = generate_password_hash(password)

            sql = """
                INSERT INTO [dbo].[User] (username, password, email, role)
                VALUES (?, ?, ?, 'user')
            """
            
            cursor.execute(sql, (username, hashed_password, email))
            conn.commit()

            print(f"User {username} berhasil terdaftar dengan email {email}.")
            return True
        
        except Exception as e:
            print("Error saat registrasi:", e)
            return False
        finally:
            if 'conn' in locals(): conn.close()

    def logout(self):
        if self.current_user:
            print(f"User {self.current_user.username} telah logout.")
            self.current_user = None
        else:
            print("Tidak ada user yang login.")

    def get_current_user(self):
        return self.current_user

    # ==========================================
    #       LOGIKA FORGOT PASSWORD (BARU)
    # ==========================================

    def check_email_exists(self, email: str):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            sql = "SELECT COUNT(*) FROM [dbo].[User] WHERE email = ?"
            cursor.execute(sql, (email,))
            result = cursor.fetchone()[0]

            return result > 0
        
        except Exception as e:
            print("Error check email:", e)
            return False
        finally:
            if 'conn' in locals(): conn.close()

    def send_otp(self, target_email):
        """Mengirim OTP dengan CSS terpisah"""
        
        otp_code = str(random.randint(1000, 9999))

        msg = MIMEMultipart()
        msg['From'] = f"MoneyTime <{email_sender}>"
        msg['To'] = target_email
        msg['Subject'] = "Kode Verifikasi Reset Password Anda"

        # 1. BACA FILE CSS EMAIL
        css_content = ""
        try:
            # Path relative dari main.py
            css_path = os.path.join('View', 'static', 'styleForgotPasswordEmail.css')
            with open(css_path, 'r') as f:
                css_content = f.read()
        except Exception as e:
            print(f"Warning: Gagal membaca file CSS Email: {e}")

        # 2. RENDER TEMPLATE HTML
        try:
            html_content = render_template(
                'email/otp_email.html', 
                otp_code=otp_code, 
                css_style=css_content 
            )
        except Exception as e:
            print(f"Error rendering template: {e}")
            html_content = f"Kode OTP Anda adalah: {otp_code}"

        msg.attach(MIMEText(html_content, 'html'))

        # 3. KIRIM EMAIL
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(email_sender, email_password)
            server.sendmail(email_sender, target_email, msg.as_string())
            server.quit()
            
            print(f"[SUCCESS] Email OTP {otp_code} terkirim ke {target_email}")
            return otp_code 
            
        except Exception as e:
            print(f"[ERROR] Gagal kirim email: {e}")
            return None

    def update_password(self, email, new_password):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Hashing password sebelum disimpan
            hashed_password = generate_password_hash(new_password)

            sql = "UPDATE [dbo].[User] SET password = ? WHERE email = ?"
            cursor.execute(sql, (hashed_password, email))
            conn.commit()
            return True
        
        except Exception as e:
            print("Error update password:", e)
            return False
        finally:
            if 'conn' in locals(): conn.close()