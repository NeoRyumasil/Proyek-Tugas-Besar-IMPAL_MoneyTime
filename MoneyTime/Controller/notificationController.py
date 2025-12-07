from Controller.databaseController import db_connect
from Controller.finansialController import FinansialController
from Controller.credentials import email_sender, email_password

import smtplib
import os

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage


class NotificationController():
    def __init__(self):
        pass

    # Kirim email notifikasi
    def kirim_notifikasi(self, user_id: str, pesan: str):
        try:
            # Ambil email user dari database
            conn = db_connect()
            cursor = conn.cursor()

            sql = """
                SELECT email
                FROM [dbo].[User]
                WHERE id = ?
            """

            cursor.execute(sql, (user_id,))
            result = cursor.fetchone()

            if not result:
                print("User tidak ditemukan.")
                return False

            email_penerima = result[0]

            # Siapkan email
            msg = MIMEMultipart()
            msg['From'] = email_sender
            msg['To'] = email_penerima
            msg['Subject'] = "Notifikasi dari MoneyTime"

            # Tambahkan isi pesan
            msg.attach(MIMEText(pesan, 'plain'))

            # Kirim email
            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(email_sender, email_password)
                server.send_message(msg)

            print("Notifikasi terkirim ke", email_penerima)
            return True

        except Exception as e:
            print("Error saat mengirim notifikasi:", e)
            return False

        finally:
            if 'conn' in locals(): conn.close()

   # Tampilkan notifikasi
    def tampilkan_notifikasi(self, user_id: str):
        # cek finansial user di database
        finansialController = FinansialController()

        finansialController.get_or_create_finansial(user_id)
        
        pass