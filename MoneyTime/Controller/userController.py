from Model.user import User          
from Controller.databaseController import db_connect

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
import random
import os
from werkzeug.security import generate_password_hash, check_password_hash
from flask import render_template

class UserController:
    def __init__(self):
        self.current_user = None  

    def login(self, username, email, password):
        try:
            conn = db_connect()
            cursor = conn.cursor()

            sql = """
                SELECT id, username, email, password
                FROM [dbo].[User]
                WHERE email = %s OR username = %s
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
        """Menyimpan user baru ke database"""
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Cek duplikat lagi untuk keamanan
            check_sql = "SELECT COUNT(*) FROM [dbo].[User] WHERE username = %s OR email = %s"
            cursor.execute(check_sql, (username, email))
            count = cursor.fetchone()[0]
            
            if count > 0:
                print(f"User {username} atau email {email} sudah terdaftar.")
                return "exists"
              
            hashed_password = generate_password_hash(password)

            sql = """
                INSERT INTO [dbo].[User] (username, password, email, role)
                VALUES (%s, %s, %s, 'user')
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
    
    def get_current_user_id(self):
        if self.current_user:
            return self.current_user.get_user_id()
        return None

    # ==========================================
    #       LOGIKA FORGOT PASSWORD
    # ==========================================

    def check_email_exists(self, email: str):
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = "SELECT COUNT(*) FROM [dbo].[User] WHERE email = %s"
            cursor.execute(sql, (email,))
            result = cursor.fetchone()[0]
            return result > 0
        except Exception as e:
            print("Error check email:", e)
            return False
        finally:
            if 'conn' in locals(): conn.close()

    def check_username_exists(self, username: str):
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = "SELECT COUNT(*) FROM [dbo].[User] WHERE username = %s"
            cursor.execute(sql, (username,))
            result = cursor.fetchone()[0]
            return result > 0
        except Exception as e:
            print("Error check username:", e)
            return False
        finally:
            if 'conn' in locals(): conn.close()

    def send_otp(self, target_email):
        """Mengirim OTP Reset Password"""
        email_sender = os.getenv('EMAIL_SENDER')
        email_password = os.getenv('EMAIL_PASSWORD')

        otp_code = str(random.randint(1000, 9999))

        msg = MIMEMultipart('related')
        msg['From'] = f"MoneyTime <{email_sender}>"
        msg['To'] = target_email
        msg['Subject'] = "Kode Verifikasi Reset Password Anda"

        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)

        css_content = ""
        try:
            css_path = os.path.join('View', 'static', 'styleForgotPasswordEmail.css')
            with open(css_path, 'r') as f:
                css_content = f.read()
        except Exception as e:
            print(f"Warning: Gagal membaca file CSS Email: {e}")

        try:
            html_content = render_template(
                'email/otp_email.html', 
                otp_code=otp_code, 
                css_style=css_content 
            )
        except Exception as e:
            html_content = f"Kode OTP Anda adalah: {otp_code}"

        msg_alternative.attach(MIMEText(html_content, 'html'))

        # Attach Logo
        try:
            img_path = os.path.join('View', 'static', 'avatarHeader.png')
            with open(img_path, 'rb') as f:
                image = MIMEImage(f.read())
                image.add_header('Content-ID', '<logo_img>')
                image.add_header('Content-Disposition', 'inline', filename='avatarHeader.png')
                msg.attach(image)
        except Exception as e:
            print(f"Warning: Gagal attach logo: {e}")

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
            hashed_password = generate_password_hash(new_password)
            sql = "UPDATE [dbo].[User] SET password = %s WHERE email = %s"
            cursor.execute(sql, (hashed_password, email))
            conn.commit()
            return True
        except Exception as e:
            print("Error update password:", e)
            return False
        finally:
            if 'conn' in locals(): conn.close()

    # ==========================================
    #       LOGIKA ACCOUNT VALIDATION
    # ==========================================

    def send_validation_otp(self, target_email):
        """Mengirim OTP untuk validasi akun"""
        email_sender = os.getenv('EMAIL_SENDER')
        email_password = os.getenv('EMAIL_PASSWORD')

        otp_code = str(random.randint(1000, 9999))

        msg = MIMEMultipart('related')
        msg['From'] = f"MoneyTime <{email_sender}>"
        msg['To'] = target_email
        msg['Subject'] = "Verifikasi Akun MoneyTime Anda"

        msg_alternative = MIMEMultipart('alternative')
        msg.attach(msg_alternative)

        css_content = ""
        try:
            css_path = os.path.join('View', 'static', 'styleForgotPasswordEmail.css')
            with open(css_path, 'r') as f:
                css_content = f.read()
        except Exception as e:
            print(f"Warning: Gagal membaca file CSS Email: {e}")

        try:
            html_content = render_template(
                'email/validation_email.html',
                otp_code=otp_code,
                css_style=css_content
            )
        except Exception as e:
            html_content = f"Selamat datang! Kode verifikasi akun Anda adalah: {otp_code}"

        msg_alternative.attach(MIMEText(html_content, 'html'))

        # Attach Logo
        try:
            img_path = os.path.join('View', 'static', 'avatarHeader.png')
            with open(img_path, 'rb') as f:
                image = MIMEImage(f.read())
                image.add_header('Content-ID', '<logo_img>')
                image.add_header('Content-Disposition', 'inline', filename='avatarHeader.png')
                msg.attach(image)
        except Exception as e:
            print(f"Warning: Gagal attach logo: {e}")

        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(email_sender, email_password)
            server.sendmail(email_sender, target_email, msg.as_string())
            server.quit()
            print(f"[SUCCESS] Email Validasi {otp_code} terkirim ke {target_email}")
            return otp_code
        except Exception as e:
            print(f"[ERROR] Gagal kirim email: {e}")
            return None

    def verify_validation_otp(self, email, otp):
        """
        Verifikasi OTP sederhana. 
        KITA TIDAK CEK DATABASE KARENA USER BELUM TERSIMPAN.
        Pengecekan kecocokan OTP dilakukan di main.py via Session.
        """
        return True