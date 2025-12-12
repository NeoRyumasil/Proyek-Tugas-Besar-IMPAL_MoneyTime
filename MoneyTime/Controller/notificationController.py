import datetime
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

    def get_notifications(self, user_id):
        conn = None
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Query mengambil data
            sql = """
                SELECT NamaAktivitas, DeskripsiAktivitas, TenggatWaktu, KategoriAktivitas, Waktu
                FROM [dbo].[Aktivitas] 
                WHERE UserID = ? AND StatusAktivitas = 'Pending'
                ORDER BY TenggatWaktu ASC
            """
            
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()

            notifications = []
            
            # Waktu sekarang (datetime object)
            now = datetime.datetime.now()

            for row in rows:
                title = row[0]
                deskripsi = row[1]
                tenggat_waktu_raw = row[2] 
                kategori = row[3]
                waktu_str = row[4]

                # --- FIX: Konversi datetime.date ke datetime.datetime ---
                tenggat_waktu = None
                
                if tenggat_waktu_raw:
                    # Jika tipe datanya 'date' (hanya tanggal), ubah jadi 'datetime' (tanggal + 00:00:00)
                    if isinstance(tenggat_waktu_raw, datetime.date) and not isinstance(tenggat_waktu_raw, datetime.datetime):
                        tenggat_waktu = datetime.datetime.combine(tenggat_waktu_raw, datetime.time.min)
                    # Jika tipe datanya string (kasus jarang di pyodbc tapi mungkin terjadi)
                    elif isinstance(tenggat_waktu_raw, str):
                        try:
                            tenggat_waktu = datetime.datetime.strptime(tenggat_waktu_raw, '%Y-%m-%d %H:%M:%S')
                        except:
                            try:
                                tenggat_waktu = datetime.datetime.strptime(tenggat_waktu_raw, '%Y-%m-%d')
                            except:
                                tenggat_waktu = None
                    # Jika sudah datetime, pakai langsung
                    else:
                        tenggat_waktu = tenggat_waktu_raw

                if not tenggat_waktu:
                    continue

                # --- FIX: Update Jam jika kolom Waktu diisi ---
                # Jika user mengisi kolom 'Waktu' terpisah (misal "14:30"), kita update jam pada tenggat_waktu
                if waktu_str:
                    try:
                        # Parsing string waktu (misal "14:30:00" atau "14:30")
                        jam_str = str(waktu_str)
                        if len(jam_str) >= 5:
                            jam_obj = datetime.datetime.strptime(jam_str[:5], '%H:%M').time()
                            # Gabungkan Tanggal asli dengan Jam baru
                            tenggat_waktu = datetime.datetime.combine(tenggat_waktu.date(), jam_obj)
                            display_time = jam_str[:5]
                        else:
                            display_time = tenggat_waktu.strftime('%H:%M')
                    except:
                        display_time = tenggat_waktu.strftime('%H:%M')
                else:
                    display_time = tenggat_waktu.strftime('%H:%M')

                # Hitung selisih (Sekarang aman karena keduanya datetime)
                delta = tenggat_waktu - now
                
                notif_type = ""
                time_info = ""
                message = ""

                # --- LOGIKA STATUS ---
                if delta.total_seconds() < 0:
                    notif_type = "Overdue"
                    past_seconds = abs(delta.total_seconds())
                    
                    if past_seconds < 60:
                        time_info = "Just now"
                    elif past_seconds < 3600:
                        time_info = f"{int(past_seconds / 60)} min ago"
                    elif past_seconds < 86400:
                        time_info = f"{int(past_seconds / 3600)}h ago"
                    else:
                        time_info = f"{int(past_seconds / 86400)} days ago"
                    message = deskripsi
                else:
                    notif_type = "Reminder"
                    future_seconds = delta.total_seconds()
                    
                    if future_seconds < 60:
                        time_info = "< 1 min"
                    elif future_seconds < 3600:
                        time_info = f"In {int(future_seconds / 60)} min"
                    elif future_seconds < 86400:
                        time_info = f"In {int(future_seconds / 3600)} hours"
                    else:
                        days = int(future_seconds / 86400)
                        time_info = f"In {days} days"
                    
                    message = deskripsi

                notifications.append({
                    'title': title,
                    'message': message,
                    'date': time_info, 
                    'category': kategori,
                    'type': notif_type
                })
            
            return notifications

        except Exception as e:
            print(f"[ERROR] NotificationController Error: {e}")
            return []
        finally:
            if conn:
                conn.close()
    
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