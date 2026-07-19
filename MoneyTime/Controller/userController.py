from Database.models import User
from Database.orm import db    
from Schema.schema import UserSchema
from marshmallow import ValidationError

import os
import smtplib
import random

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from werkzeug.security import generate_password_hash, check_password_hash
from flask import render_template
from sqlalchemy import or_

class UserController:
    def __init__(self):
        self.db = db.session
        self.user_schema = UserSchema()

    # Autentikasi
    def authenticate(self, username_input, password_input):
        user = self.db.query(User).filter(or_(User.username == username_input, User.email == username_input)).first()

        if user and check_password_hash(user.password, password_input):
            return user
        
        return None
    
    # Validasi Registrasi dengan Marshmallow
    def validate_registration(self, username, email, password, confirm_password):
        if password != confirm_password:
            return {'success' : False, 'message' : "Password Not Match"}
        
        errors = self.user_schema.validate({
            "username": username,
            "email": email,
            "password": password,
            "role": "user"
        })

        if errors:
            first_error_field = list(errors.keys())[0]
            first_error_msg = errors[first_error_field][0]
            return {'success' : False, 'message' : f"Format {first_error_field} salah: {first_error_msg}"}

        existing_user = self.db.query(User).filter(or_(User.username == username, User.email == email)).first()
        
        if existing_user:
            return {'success' : False, 'message' : "Username atau Email already used"}
    
        return {'success' : True}
    
    # Finalisasi Registrasi
    def finalize_registration(self, username, email, password):
        try:
            hashed_password = generate_password_hash(password)
        
            new_user = User(username=username, password=hashed_password, email=email, role='user')
            self.db.add(new_user)
            self.db.commit()
            return True
        
        except Exception as error:
            self.db.rollback()
            print(f"Error Registrasi: {error}")
            return False
    
    # Cek Email
    def check_email(self, email):
        return self.db.query(User).filter_by(email=email).first() is not None
    
    # Update Password
    def update_password(self, email, password):
        try:
            errors = self.user_schema.validate({"password": password}, partial=True)
            if errors:
                return False

            user = self.db.query(User).filter_by(email=email).first()

            if user:
                user.password = generate_password_hash(password)
                self.db.commit()
                return True

            return False
        
        except Exception as error:
            self.db.rollback()
            print(f"Error Update Password: {error}")
            return False
    
    # Kirim OTP ke Email
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