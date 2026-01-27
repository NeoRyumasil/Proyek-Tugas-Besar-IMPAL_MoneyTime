from Model.user import User          

import os
import smtplib
import random

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from werkzeug.security import generate_password_hash, check_password_hash
from flask import render_template

class UserController:

    # Autentikasi
    def authenticate(self, username_input, password_input):
        user = User.find_email_or_username(username_input)

        if user and check_password_hash(user.password, password_input):
            return user
        
        return None
    
    # Validasi Registrasi
    def validate_registration(self, username, email, password, confirm_password):
        if password != confirm_password:
            return {'success' : False, 'message' : "Password Gak Cocok"}
        
        if User.check_user_email_exist(username, email):
            return {'success' : False, 'message' : "Username atau Email sudah ada"}
    
        return {'success' : True}
    
    # Finalisasi Registrasi
    def finalize_registration(self, username, email, password):
        hashed_password = generate_password_hash(password)
        return User.create_user(username, hashed_password, email)
    
    # Cek Email
    def check_email(self, email):
        return User.check_user_email_exist(email, email)
    
    # Update Password
    def update_password(self, email, password):
        hashed_password = generate_password_hash(password)
        return User.update_password(email, hashed_password)
    
    # Kirm OTP ke Email
    def send_otp_email(self, target_email, subject, template):
        email_sender = os.getenv('EMAIL_SENDER')
        email_password = os.getenv('EMAIL_PASSWORD')
        otp_code = str(random.randint(1000, 9999))

        message = MIMEMultipart('related')
        message['From'] = f"Moneytime <{email_sender}>"
        message['To'] = target_email
        message['Subject'] = subject

        message_alternative = MIMEMultipart('alternative')
        message.attach(message_alternative)

        # Load CSS
        css_content = ""
        
        try:
            css_path = os.path.join('View', 'static', 'styleForgotPasswordEmail.css')
            with open(css_path, 'r') as f: css_content = f.read()
        
        except:
            pass

        # Load HTML
        try:
            html_content = render_template(template, otp_code=otp_code, css_style=css_content)
        except Exception:
            html_content = f"Kode OTP Anda: {otp_code}"
        
        message_alternative.attach(MIMEText(html_content, 'html'))

        # Logo
        try:
            image_path = os.path.join('View', 'static', 'avatarHeader.png')
            with open(image_path, 'rb') as f:
                image = MIMEImage(f.read())
                image.add_header('Content-ID', '<logo_image>')
                image.add_header('Content-Disposition', 'inline', filename='avatarHeader.png')
                message.attach(image)
        
        except:
            pass

        # Kirim Kode OTP
        try:
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(email_sender, email_password)
            server.sendmail(email_sender, target_email, message.as_string())
            server.quit()
            return otp_code
    
        except Exception as error:
            print(f"Error kirim email: {error}")
            return None
    
    # OTP untuk Validasi
    def send_validation_otp(self, email):
        return self.send_otp_email(email, "Verifikasi Akun Moneytime", 'email/validation_email.html')
    
    # OTP untuk Reset Password
    def send_reset_otp(self, email):
        return self.send_otp_email(email, "Reset Password Moneytime", 'email/otp_email.html')
