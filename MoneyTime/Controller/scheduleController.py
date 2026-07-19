from Database.models import Aktivitas
from Database.orm import db
from Utils.cache import cache
from Schema.schema import AktivitasSchema
from marshmallow import ValidationError
from typing import List, Dict, Any
from datetime import datetime

class ScheduleController:
    def __init__(self):
        self.db = db.session
        self.aktivitas_schema = AktivitasSchema()

    # Tambah Aktivitas
    def add_schedule(self, user_id: str, title: str, description: str, date: str, time: str, category: str, priority: str) -> bool:
        try:
            
            new_aktivitas = self.aktivitas_schema.load({
                "userid": user_id,
                "nama_aktivitas": title,
                "deskripsi": description,
                "tenggat": date,
                "waktu": time,
                "kategori": category,
                "prioritas": priority,
                "status": "Pending",
                "isread": False
            })
            
            self.db.add(new_aktivitas)
            self.db.commit()

            cache.delete_memoized(self.get_categories, user_id)
            cache.delete_memoized(self.get_schedule_summary, user_id)

            return True
            
        except ValidationError as error:
            self.db.rollback()
            print(f"Validasi Schema Gagal (Add): {error.messages}")
            return False
        
        except Exception as error:
            self.db.rollback()
            print(f"Error add schedule: {error}")
            return False

    # Cari Aktivitas
    def get_schedules(self, user_id: str, page: int = 1, per_page: int = 10) -> List[Dict[str, Any]]:
        query = self.db.query(Aktivitas).filter_by(userid=user_id)
        rows = db.paginate(query, page=page, per_page=per_page, error_out=False)
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
        
        return {
            'data': results,
            'total_items': rows.total,
            'total_pages': rows.pages,
            'current_page': rows.page,
            'has_next': rows.has_next,
            'has_prev': rows.has_prev
        }

    # Update Status
    def update_status(self, schedule_id: int, status: str) -> bool:
        try:
            
            errors = self.aktivitas_schema.validate({"status": status}, partial=True)

            if errors:
                return False

            aktivitas = self.db.query(Aktivitas).filter_by(aktivitasid=schedule_id).first()
            if aktivitas:
                aktivitas.status = status
                user_id = aktivitas.userid
                self.db.commit()

                cache.delete_memoized(self.get_schedule_summary, user_id)
                return True
            
            return False
            
        except Exception as error:
            self.db.rollback()
            print(f"Error update status: {error}")
            return False

    # Edit Aktivitas
    def edit_schedule(self, schedule_id: int, title: str, description: str, date: str, time: str, category: str, priority: str) -> bool:
        try:
            
            errors = self.aktivitas_schema.validate({
                "nama_aktivitas": title,
                "deskripsi": description,
                "tenggat": date,
                "waktu": time,
                "kategori": category,
                "prioritas": priority
            }, partial=True)

            if errors:
                print(f"Validasi Schema Gagal (Edit): {errors}")
                return False

            aktivitas = self.db.query(Aktivitas).filter_by(aktivitasid=schedule_id).first()

            if aktivitas:
                aktivitas.nama_aktivitas = title
                aktivitas.deskripsi = description
                aktivitas.tenggat = datetime.strptime(date, '%Y-%m-%d').date()
                aktivitas.waktu = time
                aktivitas.kategori = category
                aktivitas.prioritas = priority
                
                user_id = aktivitas.userid
                self.db.commit()

                cache.delete_memoized(self.get_categories, user_id)
                cache.delete_memoized(self.get_schedule_summary, user_id)
                return True
            
            return False
            
        except Exception as error:
            self.db.rollback()
            print(f"Error edit schedule: {error}")
            return False

    # Hapus Aktivitas
    def delete_schedule(self, schedule_id: int) -> bool:
        try:
            aktivitas = self.db.query(Aktivitas).filter_by(aktivitasid=schedule_id).first()
            if aktivitas:
                user_id = aktivitas.userid
                self.db.delete(aktivitas)
                self.db.commit()

                cache.delete_memoized(self.get_categories, user_id)
                cache.delete_memoized(self.get_schedule_summary, user_id)
                
                return True
            
            return False
            
        except Exception as error:
            self.db.rollback()
            print(f"Error delete schedule: {error}")
            return False

    # Cari Kategori
    @cache.memoize(timeout=300)
    def get_categories(self, user_id: str) -> List[str]:
        rows = self.db.query(Aktivitas.kategori).filter_by(userid=user_id).distinct().all()
        return [row[0] for row in rows if row[0]]
    
    # Buat Summary dari Schedule (Untuk AI)
    @cache.memoize(timeout=300)
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