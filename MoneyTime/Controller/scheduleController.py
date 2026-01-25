from Model.aktivitas import Aktivitas
from typing import List, Dict, Any
from datetime import datetime

class ScheduleController:
    def __init__(self):
        self.model = Aktivitas()

    # Tambah Aktivitas
    def add_schedule(self, user_id: str, title: str, description: str, date: str, time: str, category: str, priority: str) -> bool:
        tenggat_waktu = f"{date} {time}"
        return self.model.create_activity(user_id, title, description, tenggat_waktu, time, category, priority)

    # Cari Aktivitas
    def get_schedules(self, user_id: str) -> List[Dict[str, Any]]:
        rows = self.model.get_user_activity(user_id)
        results = []

        for row in rows:
            tenggat_waktu = row[3]
            tenggat = ""

            if tenggat_waktu:
                if isinstance(tenggat_waktu, datetime):
                    tenggat = tenggat_waktu.strftime('%d-%m-%Y')
                else:
                    tenggat = str(tenggat_waktu).split(' ')[0]

            if row[4]:
                time = row[4]
            else:
                time = "23:59"

            results.append({
                'id': row[0],
                'title': row[1] if row[1] else "No Activity",
                'description': row[2] if row[2] else "",
                'date': tenggat,
                'time': time,
                'category': row[5] if row[5] else "Other",
                'priority': row[6] if row[6] else "None",
                'status': row[7] if row[7] else "Pending"
            }) 

            results.sort(key=lambda x: x['date'] if x['date'] else '31-12-0000')
            return results

    # Update Status
    def update_status(self, schedule_id: int, status: str) -> bool:
        return self.model.update_status(schedule_id, status)

    # Edit Aktivitas
    def edit_schedule(self, schedule_id: int, title: str, description: str, date: str, time: str, category: str, priority: str) -> bool:
        tenggat_waktu = f"{date} {time}"
        return self.model.update_activity(schedule_id, title, description, tenggat_waktu, time, category, priority)

    # Hapus Aktivitas
    def delete_schedule(self, schedule_id: int) -> bool:
        return self.model.delete_activity(schedule_id)

    # Cari Kategori
    def get_categories(self, user_id: str) -> List[str]:
        return self.model.get_category(user_id)
    
    # Buat Summary dari Schedule (Untuk AI)
    def get_schedule_summary(self, user_id):
       schedules = self.get_schedules(user_id)

       if not schedules:
           return "Gak ada Jadwalnya"
       
       total_schedules = len(schedules)
       pending_schedules = sum(1 for schedule in schedules if schedule['status'].lower() == 'pending')
       completed_schedules = sum(1 for schedule in schedules if schedule['status'].lower() == 'completed')

       priority_order = {'High' : 0, 'Medium' : 1, 'Low': 2, 'None': 3}

       pending_schedules = sorted(
           [schedule for schedule in schedules if schedule['status'].lower() == 'pending'],
           key=lambda priority : (priority_order.get(priority['priority'], 99), priority['date'], priority['time'])
       )

       top_pending = pending_schedules[:7]

       summary = [
           f"Ringkasan Aktivitas User: \n",
           f"Total Aktivitas: {total_schedules}",
           f"Pending : {pending_schedules}",
           f"Selesai : {completed_schedules}"
       ]

       if top_pending:
           summary.append("Aktivitas Terdekat: ")
           for schedule in top_pending:
               summary.append(f" - [{schedule['priority']}] {schedule['title']} ({schedule['category']} - Tenggat: {schedule['date']} {schedule['time']})")
       else:
           summary.append("Aktivitasnya selesai semua YAY")

       return "\n".join(summary)

    