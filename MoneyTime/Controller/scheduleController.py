from Database.models import Aktivitas
from Database.orm import get_db
from typing import List, Dict, Any
from datetime import datetime

class ScheduleController:
    def __init__(self):
        self.db = next(get_db())

    # Tambah Aktivitas
    def add_schedule(self, user_id: str, title: str, description: str, date: str, time: str, category: str, priority: str) -> bool:
        try:
            tenggat_waktu = datetime.strptime(f"{date}", '%Y-%m-%d').date()
            
            new_aktivitas = Aktivitas(
                userid=user_id,
                nama_aktivitas=title,
                deskripsi=description,
                tenggat=tenggat_waktu,
                waktu=time,
                kategori=category,
                prioritas=priority,
                status="Pending",
                isread=False
            )
            
            self.db.add(new_aktivitas)
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            print(f"Error add schedule: {e}")
            return False

    # Cari Aktivitas
    def get_schedules(self, user_id: str) -> List[Dict[str, Any]]:
        rows = self.db.query(Aktivitas).filter_by(userid=user_id).all()
        results = []

        for row in rows:
            tenggat = row.tenggat.strftime('%d-%m-%Y') if row.tenggat else ""
            time = row.waktu if row.waktu else "23:59"

            results.append({
                'id': row.aktivitasid,
                'title': row.nama_aktivitas or "No Activity",
                'description': row.deskripsi or "",
                'date': tenggat,
                'time': time,
                'category': row.kategori or "Other",
                'priority': row.prioritas or "None",
                'status': row.status or "Pending"
            }) 

        results.sort(key=lambda x: datetime.strptime(x['date'], '%d-%m-%Y') if x['date'] else datetime.max)
        return results

    # Update Status
    def update_status(self, schedule_id: int, status: str) -> bool:
        try:
            aktivitas = self.db.query(Aktivitas).filter_by(aktivitasid=schedule_id).first()
            if aktivitas:
                aktivitas.status = status
                self.db.commit()
                return True
            
            return False
            
        except Exception as e:
            self.db.rollback()
            print(f"Error update status: {e}")
            return False

    # Edit Aktivitas
    def edit_schedule(self, schedule_id: int, title: str, description: str, date: str, time: str, category: str, priority: str) -> bool:
        try:
            aktivitas = self.db.query(Aktivitas).filter_by(aktivitasid=schedule_id).first()
            if aktivitas:
                aktivitas.nama_aktivitas = title
                aktivitas.deskripsi = description
                aktivitas.tenggat = datetime.strptime(date, '%Y-%m-%d').date()
                aktivitas.waktu = time
                aktivitas.kategori = category
                aktivitas.prioritas = priority
                
                self.db.commit()
                return True
            
            return False
            
        except Exception as e:
            self.db.rollback()
            print(f"Error edit schedule: {e}")
            return False

    # Hapus Aktivitas
    def delete_schedule(self, schedule_id: int) -> bool:
        try:
            aktivitas = self.db.query(Aktivitas).filter_by(aktivitasid=schedule_id).first()
            if aktivitas:
                self.db.delete(aktivitas)
                self.db.commit()
                return True
            
            return False
            
        except Exception as e:
            self.db.rollback()
            print(f"Error delete schedule: {e}")
            return False

    # Cari Kategori
    def get_categories(self, user_id: str) -> List[str]:
        rows = self.db.query(Aktivitas.kategori).filter_by(userid=user_id).distinct().all()
        return [row[0] for row in rows if row[0]]
    
    # Buat Summary dari Schedule (Untuk AI)
    def get_schedule_summary(self, user_id):
       schedules = self.get_schedules(user_id)

       if not schedules:
           return "Gak ada Jadwalnya"
       
       total_schedules = len(schedules)
       pending_count = sum(1 for schedule in schedules if schedule['status'].lower() == 'pending')
       completed_schedules = sum(1 for schedule in schedules if schedule['status'].lower() == 'completed')

       priority_order = {'High' : 0, 'Medium' : 1, 'Low': 2, 'None': 3}

       pending_schedules = sorted(
           [schedule for schedule in schedules if schedule['status'].lower() == 'pending'],
           key=lambda p : (priority_order.get(p['priority'], 99), datetime.strptime(p['date'], '%d-%m-%Y') if p['date'] else datetime.max, p['time'])
       )

       top_pending = pending_schedules[:7]

       summary = [
           f"Ringkasan Aktivitas User: \n",
           f"Total Aktivitas: {total_schedules}",
           f"Pending : {pending_count}",
           f"Selesai : {completed_schedules}"
       ]

       if top_pending:
           summary.append("Aktivitas Terdekat: ")
           for schedule in top_pending:
               summary.append(f" - [{schedule['priority']}] {schedule['title']} ({schedule['category']} - Tenggat: {schedule['date']} {schedule['time']})")
       else:
           summary.append("Aktivitasnya selesai semua YAY")

       return "\n".join(summary)