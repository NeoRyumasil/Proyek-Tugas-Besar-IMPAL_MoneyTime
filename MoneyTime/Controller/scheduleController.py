from Controller.databaseController import db_connect
from typing import List, Dict, Any
from datetime import datetime

class ScheduleController:
    def __init__(self):
        pass

    def add_schedule(self, user_id: str, title: str, description: str, date: str, time: str, category: str, priority: str) -> bool:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            tenggat_waktu = f"{date} {time}"
            
            sql = """
                INSERT INTO [dbo].[Aktivitas] 
                (UserID, NamaAktivitas, DeskripsiAktivitas, TenggatWaktu, Waktu, KategoriAktivitas, PrioritasAktivitas, StatusAktivitas)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'Pending')
            """
            cursor.execute(sql, (user_id, title, description, tenggat_waktu, time, category, priority))
            conn.commit()
            return True
        except Exception as e:
            print(f"[ScheduleController] add_schedule error: {e}")
            return False
        finally:
            if 'conn' in locals(): conn.close()

    def get_schedules(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            
            sql = """
                SELECT AktivitasID, NamaAktivitas, DeskripsiAktivitas, TenggatWaktu, Waktu, KategoriAktivitas, PrioritasAktivitas, StatusAktivitas
                FROM [dbo].[Aktivitas]
                WHERE UserID = %s
            """
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                db_datetime = row[3]
                date_str = ""
                
                if db_datetime:
                    if isinstance(db_datetime, datetime):
                        date_str = db_datetime.strftime('%Y-%m-%d')
                    else:
                        date_str = str(db_datetime).split(' ')[0] # Fallback string

                # Gunakan kolom Waktu (row[4]) jika ada, jika tidak default 00:00
                time_str = row[4] if row[4] else "00:00"

                results.append({
                    'id': row[0],
                    'title': row[1] if row[1] else "No Title",
                    'description': row[2] if row[2] else "",
                    'date': date_str,
                    'time': time_str,
                    'category': row[5] if row[5] else "Other",
                    'priority': row[6] if row[6] else "None",
                    'status': row[7] if row[7] else "Pending"
                })
            
            results.sort(key=lambda x: x['date'] if x['date'] else '9999-12-31')
            return results
        except Exception as e:
            print(f"[ScheduleController] get_schedules error: {e}")
            return []
        finally:
            if 'conn' in locals(): conn.close()

    def update_status(self, schedule_id: int, status: str) -> bool:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = "UPDATE [dbo].[Aktivitas] SET StatusAktivitas = %s WHERE AktivitasID = %s"
            cursor.execute(sql, (status, schedule_id))
            conn.commit()
            return True
        except Exception as e:
            print(f"[ScheduleController] update_status error: {e}")
            return False
        finally:
            if 'conn' in locals(): conn.close()

    # --- FUNGSI BARU UNTUK EDIT & DELETE ---

    def edit_schedule(self, schedule_id: int, title: str, description: str, date: str, time: str, category: str, priority: str) -> bool:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            
            # Update Kolom TenggatWaktu (Date + Time) dan Kolom Waktu (Time Only)
            tenggat_waktu = f"{date} {time}"

            sql = """
                UPDATE [dbo].[Aktivitas]
                SET NamaAktivitas = %s, 
                    DeskripsiAktivitas = %s, 
                    TenggatWaktu = %s, 
                    Waktu = %s, 
                    KategoriAktivitas = %s, 
                    PrioritasAktivitas = %s
                WHERE AktivitasID = %s
            """
            cursor.execute(sql, (title, description, tenggat_waktu, time, category, priority, schedule_id))
            conn.commit()
            return True
        except Exception as e:
            print(f"[ScheduleController] edit_schedule error: {e}")
            return False
        finally:
            if 'conn' in locals(): conn.close()

    def delete_schedule(self, schedule_id: int) -> bool:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = "DELETE FROM [dbo].[Aktivitas] WHERE AktivitasID = %s"
            cursor.execute(sql, (schedule_id,))
            conn.commit()
            return True
        except Exception as e:
            print(f"[ScheduleController] delete_schedule error: {e}")
            return False
        finally:
            if 'conn' in locals(): conn.close()
    def get_categories(self, user_id: str) -> List[str]:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            
            # Ambil kategori unik yang SUDAH ADA di database user
            sql = "SELECT DISTINCT KategoriAktivitas FROM [dbo].[Aktivitas] WHERE UserID = %s"
            cursor.execute(sql, (user_id,))
            rows = cursor.fetchall()
            
            # Bersihkan hasil (hapus None/Empty)
            categories = [row[0] for row in rows if row[0] and row[0].strip() != ""]
            
            # [HAPUS BAGIAN DEFAULT] 
            # Kode lama yang menambahkan ["Academic", "Project"...] dihapus.
            # Sekarang murni mengembalikan apa yang ada di database.
            
            return sorted(categories)
        except Exception as e:
            print(f"[ScheduleController] get_categories error: {e}")
            return [] # Return list kosong jika error/tidak ada data
        finally:
            if 'conn' in locals(): conn.close()
    
    
    def get_schedule_summary(self, user_id):
        try :
            schedules = self.get_schedules(user_id)

            if not schedules:
                return "Gak ada jadwalnya"

            total_schedule = len(schedules)
            pending_schedule = sum(1 for schedule in schedules if schedule['status'].lower() == 'pending')
            completed_schedule = sum(1 for schedule in schedules if schedule['status'].lower() == 'completed')

            priority_order = {'High' : 0, 'Medium' : 1, 'Low' : 2, 'None' : 3}

            pending_schedules = sorted(
                [schedule for schedule in schedules if schedule['status'].lower() == 'pending'],
                key=lambda priority : (priority_order.get(priority['priority'], 99), priority['date'], priority['time'])
            )

            top_pending = pending_schedules[:5]

            summary = [
                f"Ringkasan Aktivitas User: \n",
                f"- Total Aktivitas: {total_schedule}",
                f"- Pending : {pending_schedule}",
                f"- Selesai : {completed_schedule}\n"
            ]

            if top_pending:
                summary.append("5 Aktivitas Terdekat:")
                for schedule in top_pending:
                    summary.append(f"  - [{schedule['priority']}] {schedule['title']} ({schedule['category']}) - Tenggat: {schedule['date']} {schedule['time']}")
            else:
                summary.append("Kamu keren aktivitasnya selesai semua")
            
            return "\n".join(summary)
        
        except Exception as e:
            print(f"[Schedule Controller] Summary error : {e}")
            return []

    