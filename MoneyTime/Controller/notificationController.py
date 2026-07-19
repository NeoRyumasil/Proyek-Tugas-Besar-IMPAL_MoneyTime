import datetime
import resend
import os

from Database.models import Aktivitas, User
from Database.orm import db

class NotificationController():
    def __init__(self):
        self.db = db.session

    # Ambil notifikasi
    def get_notifications(self, user_id):
        rows = self.db.query(Aktivitas).filter(Aktivitas.userid == user_id, Aktivitas.status == 'Pending').order_by(Aktivitas.tenggat.asc()).all()

        notification = []
        now = datetime.datetime.now()

        for row in rows:
            title = row.nama_aktivitas
            deskripsi = row.deskripsi
            tenggat_waktu_raw = row.tenggat
            kategori = row.kategori
            waktu = row.waktu
            id_aktivitas = row.aktivitasid
            is_read = row.isread
        
            tenggat_waktu = self.parse_datetime(tenggat_waktu_raw)
            
            if not tenggat_waktu:
                continue

            tenggat_waktu = self.apply_custom_date(tenggat_waktu, waktu)

            delta = tenggat_waktu - now
            time_info, notif_type = self.calculate_time(delta)

            if isinstance(is_read, bool):
                is_read = is_read
            else:
                is_read = bool(is_read)

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
        try:
            self.db.query(Aktivitas).filter_by(userid=user_id).update({"isread": True})
            self.db.commit()
            return True
        
        except Exception as e:
            self.db.rollback()
            print(f"Error Mark All Read: {e}")
            return False
    
    # Mark as Read
    def mark_as_read(self, aktivitas_id):
        try:
            aktivitas = self.db.query(Aktivitas).filter_by(aktivitasid=aktivitas_id).first()
            if aktivitas:
                aktivitas.isread = True
                self.db.commit()
                return True
            
            return False
        
        except Exception as e:
            self.db.rollback()
            print(f"Error Mark Read: {e}")
            return False
    
    # Toggle Status
    def toggle_status(self, aktivitas_id):
        try:
            aktivitas = self.db.query(Aktivitas).filter_by(aktivitasid=aktivitas_id).first()
            if aktivitas:
                new_value = not bool(aktivitas.isread)
                aktivitas.isread = new_value
                self.db.commit()
                return True, new_value
            
            return False, None
        
        except Exception as e:
            self.db.rollback()
            print(f"Error update toggle: {e}")
            return False, None
    
    # Kirim email notifikasi
    def kirim_notifikasi(self, user_id: str, pesan: str):
        try:
            user = self.db.query(User).filter_by(id=user_id).first()

            if not user or not user.email:
                print("Email User Tidak Ditemukan")
                return False
            
            resend.api_key = os.getenv('RESEND_API_KEY')

            params = {
                "from": "MoneyTime <onboarding@resend.dev>",
                "to": [user.email],
                "subject": "Notifikasi dari MoneyTime",
                "text": pesan
            }

            resend.Emails.send(params)
            return True
        
        except Exception as error:
            print(f"Error mengirim notifikasi {error}")
            return False