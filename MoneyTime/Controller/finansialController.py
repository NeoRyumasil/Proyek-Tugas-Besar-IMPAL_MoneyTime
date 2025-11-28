from typing import Optional, List, Dict, Any
from Controller.databaseController import db_connect


class FinansialController:
    def __init__(self):
        pass

    def get_or_create_finansial(self, user_id: str, kategori: str, budget: int = 0, status: str = 'active') -> Optional[int]:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            cursor.execute("SELECT FinansialID FROM [dbo].[Finansial] WHERE UserID = ? AND kategori = ?", (user_id, kategori))
            row = cursor.fetchone()
            if row:
                return int(row[0])

            cursor.execute("INSERT INTO [dbo].[Finansial] (UserID, budget, kategori, status) VALUES (?, ?, ?, ?)", (user_id, budget, kategori, status))
            conn.commit()
            cursor.execute("SELECT TOP 1 FinansialID FROM [dbo].[Finansial] WHERE UserID = ? AND kategori = ? ORDER BY FinansialID DESC", (user_id, kategori))
            new_row = cursor.fetchone()
            return int(new_row[0]) if new_row else None
        except Exception as e:
            print(f"[FinansialController] get_or_create_finansial error: {e}")
            return None

    def add_pemasukan(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: Optional[str] = None) -> bool:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            if tanggal:
                cursor.execute("INSERT INTO [dbo].[Pemasukkan] (deskripsi, nominal, FinansialID, tanggal) VALUES (?, ?, ?, ?)", (deskripsi, nominal, finansial_id, tanggal))
            else:
                cursor.execute("INSERT INTO [dbo].[Pemasukkan] (deskripsi, nominal, FinansialID) VALUES (?, ?, ?)", (deskripsi, nominal, finansial_id))
            conn.commit()
            return True
        except Exception as e:
            print(f"[FinansialController] add_pemasukan error: {e}")
            return False

    def add_pengeluaran(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: Optional[str] = None) -> bool:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            if tanggal:
                cursor.execute("INSERT INTO [dbo].[Pengeluaran] (FinansialID, deskripsi, nominal, tanggal) VALUES (?, ?, ?, ?)", (finansial_id, deskripsi, nominal, tanggal))
            else:
                cursor.execute("INSERT INTO [dbo].[Pengeluaran] (FinansialID, deskripsi, nominal) VALUES (?, ?, ?)", (finansial_id, deskripsi, nominal))
            conn.commit()
            return True
        except Exception as e:
            print(f"[FinansialController] add_pengeluaran error: {e}")
            return False

    def get_transactions(self, user_id: str) -> List[Dict[str, Any]]:
        try:
            conn = db_connect()
            cursor = conn.cursor()
            cursor.execute("SELECT p.deskripsi, p.nominal, p.tanggal, f.kategori, 'Income' as tipe FROM [dbo].[Pemasukan] p JOIN [dbo].[Finansial] f ON p.FinansialID = f.FinansialID WHERE f.UserID = ?", (user_id,))
            incomes = cursor.fetchall()
            cursor.execute("SELECT q.deskripsi, q.nominal, q.tanggal, f.kategori, 'Expense' as tipe FROM [dbo].[Pengeluaran] q JOIN [dbo].[Finansial] f ON q.FinansialID = f.FinansialID WHERE f.UserID = ?", (user_id,))
            expenses = cursor.fetchall()
            results: List[Dict[str, Any]] = []
            for row in incomes:
                deskripsi, nominal, tanggal, kategori, tipe = row
                results.append({'type': tipe, 'deskripsi': deskripsi, 'nominal': int(nominal), 'tanggal': str(tanggal) if tanggal is not None else None, 'kategori': kategori})
            for row in expenses:
                deskripsi, nominal, tanggal, kategori, tipe = row
                results.append({'type': tipe, 'deskripsi': deskripsi, 'nominal': int(nominal), 'tanggal': str(tanggal) if tanggal is not None else None, 'kategori': kategori})
            try:
                results.sort(key=lambda r: r.get('tanggal') or '', reverse=True)
            except Exception:
                pass
            return results
        except Exception as e:
            print(f"[FinansialController] get_transactions error: {e}")
            return []