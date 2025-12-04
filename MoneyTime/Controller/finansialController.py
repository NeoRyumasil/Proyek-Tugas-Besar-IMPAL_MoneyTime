from typing import Optional, List, Dict, Any
from Controller.databaseController import db_connect

class FinansialController:
    def __init__(self):
        pass

    def get_or_create_finansial(self, user_id: str, kategori: str, budget: int = 0, status: str = 'active') -> Optional[int]:
        """
        Mencari FinansialID berdasarkan UserID dan Kategori.
        Jika tidak ada, buat baru dengan Status yang diberikan.
        """
        try:
            conn = db_connect()
            cursor = conn.cursor()
            
            # Cek apakah sudah ada
            cursor.execute("SELECT FinansialID FROM [dbo].[Finansial] WHERE UserID = ? AND kategori = ?", (user_id, kategori))
            row = cursor.fetchone()
            if row:
                return int(row[0])

            # Jika belum ada, Insert baru (termasuk kolom Status)
            cursor.execute("INSERT INTO [dbo].[Finansial] (UserID, budget, kategori, status) VALUES (?, ?, ?, ?)", 
                           (user_id, budget, kategori, status))
            conn.commit()
            
            # Ambil ID yang baru dibuat
            cursor.execute("SELECT TOP 1 FinansialID FROM [dbo].[Finansial] WHERE UserID = ? AND kategori = ? ORDER BY FinansialID DESC", (user_id, kategori))
            new_row = cursor.fetchone()
            return int(new_row[0]) if new_row else None
        except Exception as e:
            print(f"[FinansialController] get_or_create_finansial error: {e}")
            return None

    def add_pemasukan(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: str) -> bool:
        """Menambahkan data pemasukan beserta tanggal"""
        try:
            conn = db_connect()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO [dbo].[Pemasukkan] (deskripsi, nominal, FinansialID, Tanggal) VALUES (?, ?, ?, ?)", 
                           (deskripsi, nominal, finansial_id, tanggal))
            conn.commit()
            return True
        except Exception as e:
            print(f"[FinansialController] add_pemasukan error: {e}")
            return False

    def add_pengeluaran(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: str) -> bool:
        """Menambahkan data pengeluaran beserta tanggal"""
        try:
            conn = db_connect()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO [dbo].[Pengeluaran] (FinansialID, deskripsi, nominal, Tanggal) VALUES (?, ?, ?, ?)", 
                           (finansial_id, deskripsi, nominal, tanggal))
            conn.commit()
            return True
        except Exception as e:
            print(f"[FinansialController] add_pengeluaran error: {e}")
            return False

    def get_transactions(self, user_id: str, keyword: str = None) -> List[Dict[str, Any]]:
        """
        Mengambil semua transaksi (Pemasukan & Pengeluaran).
        Jika keyword diberikan, lakukan pencarian Partial Match (LIKE).
        """
        try:
            conn = db_connect()
            cursor = conn.cursor()
            
            if keyword:
                search_pattern = f"%{keyword}%"
                
                # Query Income + Search (Filter Deskripsi ATAU Kategori)
                sql_income = """
                    SELECT p.deskripsi, p.nominal, p.Tanggal, f.kategori, 'Income' as tipe 
                    FROM [dbo].[Pemasukkan] p 
                    JOIN [dbo].[Finansial] f ON p.FinansialID = f.FinansialID 
                    WHERE f.UserID = ? AND (p.deskripsi LIKE ? OR f.kategori LIKE ?)
                """
                params_income = (user_id, search_pattern, search_pattern)

                # Query Expense + Search (Filter Deskripsi ATAU Kategori)
                sql_expense = """
                    SELECT q.deskripsi, q.nominal, q.Tanggal, f.kategori, 'Expense' as tipe 
                    FROM [dbo].[Pengeluaran] q 
                    JOIN [dbo].[Finansial] f ON q.FinansialID = f.FinansialID 
                    WHERE f.UserID = ? AND (q.deskripsi LIKE ? OR f.kategori LIKE ?)
                """
                params_expense = (user_id, search_pattern, search_pattern)
                
            else:
                # Query Normal (Tanpa Search)
                sql_income = "SELECT p.deskripsi, p.nominal, p.Tanggal, f.kategori, 'Income' as tipe FROM [dbo].[Pemasukkan] p JOIN [dbo].[Finansial] f ON p.FinansialID = f.FinansialID WHERE f.UserID = ?"
                params_income = (user_id,)

                sql_expense = "SELECT q.deskripsi, q.nominal, q.Tanggal, f.kategori, 'Expense' as tipe FROM [dbo].[Pengeluaran] q JOIN [dbo].[Finansial] f ON q.FinansialID = f.FinansialID WHERE f.UserID = ?"
                params_expense = (user_id,)

            # Eksekusi Query
            cursor.execute(sql_income, params_income)
            incomes = cursor.fetchall()
            
            cursor.execute(sql_expense, params_expense)
            expenses = cursor.fetchall()
            
            results: List[Dict[str, Any]] = []
            
            # Mapping hasil Income ke Dictionary
            for row in incomes:
                deskripsi, nominal, tanggal, kategori, tipe = row
                results.append({
                    'type': tipe, 
                    'deskripsi': deskripsi, 
                    'nominal': int(nominal), 
                    'tanggal': str(tanggal) if tanggal else None, 
                    'kategori': kategori
                })
                
            # Mapping hasil Expense ke Dictionary
            for row in expenses:
                deskripsi, nominal, tanggal, kategori, tipe = row
                results.append({
                    'type': tipe, 
                    'deskripsi': deskripsi, 
                    'nominal': int(nominal), 
                    'tanggal': str(tanggal) if tanggal else None, 
                    'kategori': kategori
                })
                
            # Sortir berdasarkan Tanggal terbaru
            try:
                results.sort(key=lambda r: r.get('tanggal') or '', reverse=True)
            except Exception:
                pass
                
            return results
        except Exception as e:
            print(f"[FinansialController] get_transactions error: {e}")
            return []

    def get_categories(self, user_id: str) -> Dict[str, List[str]]:
        """
        Mengambil kategori unik berdasarkan transaksi yang sudah ada di database.
        Mengelompokkan berdasarkan Income dan Expense.
        Jika belum ada transaksi, kembalikan kategori default.
        """
        try:
            conn = db_connect()
            cursor = conn.cursor()

            # Query untuk Income categories
            sql_income = """
                SELECT DISTINCT f.kategori
                FROM [dbo].[Pemasukkan] p
                JOIN [dbo].[Finansial] f ON p.FinansialID = f.FinansialID
                WHERE f.UserID = ?
            """
            cursor.execute(sql_income, (user_id,))
            income_rows = cursor.fetchall()
            income_categories = [row[0] for row in income_rows] if income_rows else []

            # Query untuk Expense categories
            sql_expense = """
                SELECT DISTINCT f.kategori
                FROM [dbo].[Pengeluaran] q
                JOIN [dbo].[Finansial] f ON q.FinansialID = f.FinansialID
                WHERE f.UserID = ?
            """
            cursor.execute(sql_expense, (user_id,))
            expense_rows = cursor.fetchall()
            expense_categories = [row[0] for row in expense_rows] if expense_rows else []

            # Jika belum ada kategori, gunakan default
            if not income_categories:
                income_categories = ["Gaji", "Return Investasi", "Jual Barang", "Other"]
            if not expense_categories:
                expense_categories = ["Academic", "Project", "Organization", "Entertainment", "Other"]

            return {
                "Income": income_categories,
                "Expense": expense_categories
            }
        except Exception as e:
            print(f"[FinansialController] get_categories error: {e}")
            # Return default categories jika error
            return {
                "Income": ["Gaji", "Return Investasi", "Jual Barang", "Other"],
                "Expense": ["Academic", "Project", "Organization", "Entertainment", "Other"]
            }
