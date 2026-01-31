import datetime
import smtplib
import os

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

from Model.notifikasi import Notifikasi

class NotificationController():
    def __init__(self):
        self.model = Notifikasi()

    # Ambil notifikasi
    def get_notifications(self, user_id):
        rows = self.model.get_pending_notifications(user_id)

        notification = []
        now = datetime.datetime.now()

        for row in rows:
            title = row[0]
            deskripsi = row[1]
            tenggat_waktu_raw = row[2]
            kategori = row[3]
            waktu = row[4]
            id_aktivitas = row[5]
            is_read = row[6]
        
            tenggat_waktu = self.parse_datetime(tenggat_waktu_raw)
            
            if not tenggat_waktu:
                continue

            tenggat_waktu = self.apply_custom_date(tenggat_waktu, waktu)

            delta = tenggat_waktu - now
            time_info, notif_type = self.calculate_time(delta)

            notification.append({
                'id' : id_aktivitas,
                'title' : title,
                'message' : deskripsi,
                'date' : time_info,
                'category' : kategori,
                'type' : notif_type,
                'is_read' : is_read
            })

            return notification
        
    # Parsing datetime
    def parse_datetime(self, date):
        if not date:
            return None
        
        if isinstance(date, datetime.date) and not isinstance(date, datetime.datetime):
            return datetime.datetime.combine(date, datetime.time.min)
        
        if isinstance(date, str):

            try:
                return datetime.datetime.strptime(date, '%d-%m-%Y %H:%M:%S')
            
            except:

                try:
                    return datetime.datetime.strptime(date, '%d-%m-%Y')
                
                except:
                    return None
        
        return date
    
    # Custom Date
    def apply_custom_date(self, date, time):
        if time:

            try:
                time_str = str(time)
                if len(time_str) >= 5:
                    time_obj = datetime.datetime.strptime(time_str[:5], '%H:%M').time()
                    return datetime.datetime.combine(date.date(), time_obj)
                
            except:
                pass

        return date
    
    # Hitung Waktu
    def calculate_time(self, delta):
        if delta.total_seconds() < 0:
            notif_type = "Overdue"
            past_seconds = abs(delta.total_seconds())
            
            if past_seconds < 60:
                return "Now", notif_type
            elif past_seconds < 3600:
                return f"{int(past_seconds/60)} minutes ago", notif_type
            elif past_seconds < 86400:
                return f"{int(past_seconds / 3600)} hours ago", notif_type
            else:
                return f"{int(past_seconds / 86400)} days ago", notif_type
        
        else:
            notif_type = "Reminder"
            future_seconds =  delta.total_seconds()

            if future_seconds < 60:
                return "Under 1 Minute", notif_type
            elif future_seconds < 3600:
                return f"In {int(future_seconds / 60)} minutes", notif_type
            elif future_seconds < 86400:
                return f"In {int(future_seconds / 3600)} hours", notif_type
            else:
                days = int(future_seconds / 86400)
                return f"In {days} days", notif_type

    # Mark All Read
    def mark_all_read(self, user_id):
        return self.model.update_all_mark_read(user_id)
    
    # Mark as Read
    def mark_as_read(self, aktivitas_id):
        return self.model.update_mark_read(aktivitas_id)
    
    # Toggle Status
    def toggle_status(self, aktivitas_id):
        return self.model.update_toggle(aktivitas_id)
    
    # Kirim email notifikasi
    def kirim_notifikasi(self, user_id: str, pesan: str):
        
        try:
            email_penerima = self.model.get_email_user(user_id)

            if not email_penerima:
                print("Email User Tidak Ditemukan")
                return False
            
            email_sender = os.getenv('EMAIL_SENDER')
            email_password = os.getenv('EMAIL_PASSWORD')

            message = MIMEMultipart()
            message['From'] = email_sender
            message['To'] = email_penerima
            message['Subject'] = "Notifikasi dari MoneyTime"
            message.attach(MIMEText(pesan, 'plain'))

            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(email_sender, email_password)
                server.send_message(message)
            
            print("Notifikasi Terkirim ke ", email_penerima)
            return True
        
        except Exception as error:
            print(f"Error mengirim notifikasi {error}")
            return False
