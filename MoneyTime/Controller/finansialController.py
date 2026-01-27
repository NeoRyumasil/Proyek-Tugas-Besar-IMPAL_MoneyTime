from typing import Optional, List, Dict, Any

from Model.finansial import Finansial
from Model.pemasukkan import Pemasukkan
from Model.pengeluaran import Pengeluaran

class FinansialController:
    def __init__(self):
        self.finansial_model = Finansial()
        self.pemasukkan_model = Pemasukkan()
        self.pengeluaran_model = Pengeluaran()

    # Ambil atau tambah Finansial
    def get_or_create_finansial(self, user_id: str, kategori: str, budget: int = 0, status: str = 'active') -> Optional[int]:
        existing_id = self.finansial_model.get_user_and_category(user_id, kategori)

        if existing_id:
            return existing_id
        
        return self.finansial_model.create_financial(user_id, kategori, budget, status)

    # Tambah Pemasukkan
    def add_pemasukan(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: str) -> bool:
        return self.pemasukkan_model.create_pemasukkan(finansial_id, deskripsi, nominal, tanggal)
    
    # Tambah Pengeluaran
    def add_pengeluaran(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: str) -> bool:
        return self.pengeluaran_model.create_Pengeluaran(finansial_id, deskripsi, nominal, tanggal)

    # Ambil data transaksi
    def get_transactions(self, user_id: str, keyword: str = None) -> List[Dict[str, Any]]:
        income = self.pemasukkan_model.get_all_pemasukkan_user(user_id, keyword)
        expense = self.pengeluaran_model.get_all_Pengeluaran_user(user_id, keyword)

        result : List[Dict[str, Any]] = []

        # Mapping row
        def map_row(rows):
            for row in rows:
                transaction_id, deskripsi, nominal, tanggal, kategori, tipe = row
                result.append({
                    'id': int(transaction_id),
                    'type': tipe,
                    'deskripsi': deskripsi,
                    'nominal': int(nominal),
                    'tanggal': str(tanggal) if tanggal else None,
                    'kategori': kategori
                })
        
        map_row(income)
        map_row(expense)

        # Sorting
        try:
            result.sort(key=lambda r: r.get('tanggal') or '', reverse=True)
        
        except Exception:
            pass

        return result

    # Hapus Transaksi
    def delete_transaction(self, user_id: str, transaction_id: int, transaction_type: str) -> bool:
        if transaction_type.lower() == 'income':
            return self.pemasukkan_model.delete_pemasukkan(transaction_id, user_id)
        elif transaction_type.lower() == 'expense':
            return self.pengeluaran_model.delete_Pengeluaran(transaction_id, user_id)
        return False

    # Edit Transaksi
    def edit_transaction(self, user_id: str, transaction_id: int, transaction_type: str,
                        deskripsi: str, nominal: int, tanggal: str, kategori: str) -> bool:

        if transaction_type.lower() == 'income':
            status_type = 'Pemasukkan'
        elif transaction_type.lower() == 'expense':
            status_type = 'Pengeluaran'
        
        finansial_id = self.get_or_create_finansial(user_id, kategori, status=status_type)

        if not finansial_id:
            return False
        
        if transaction_type.lower() == 'income':
            return self.pemasukkan_model.update_pemasukkan(transaction_id, user_id, deskripsi, nominal, tanggal, finansial_id)
        elif transaction_type.lower() == 'expense':
            return self.pengeluaran_model.update_Pengeluaran(transaction_id, user_id, deskripsi, nominal, tanggal, finansial_id)
        
        return False

    # Ekstrak kategori yang ada
    def get_categories(self, user_id: str) -> Dict[str, List[str]]:
        income = self.pemasukkan_model.get_all_pemasukkan_user(user_id)
        expense = self.pengeluaran_model.get_all_Pengeluaran_user(user_id)

        kategori_income = list(set(row[4] for row in income))
        kategori_expense = list(set(row[4] for row in expense))

        if not kategori_income:
            kategori_income = ["Gaji", "Return Investasi", "Penjualan", "Lainnya"]
        
        if not kategori_expense:
            kategori_expense = ["Pendidikan", "Kebutuhan Sehari-hari", "Pajak", "Hiburan"]

        return {
            "Income" : kategori_income,
            "Expense" : kategori_expense
        }
    
    # Ringkasan finansial untuk AI
    def get_financial_summary(self, user_id: str) -> str:
        transactions = self.get_transactions(user_id)

        total_income = sum(t['nominal'] for t in transactions if t['type'] == 'Income')
        total_expense = sum(t['nominal'] for t in transactions if t['type'] == "Expense")
        balance = total_income - total_expense

        recent_transaction = transactions[:7]
        recent_transaction_str = ""

        for transaction in recent_transaction:
            recent_transaction_str += f"{transaction['deskripsi']} ({transaction['type']}): Rp. {transaction['nominal']:,}\n"

        summary = (
            f"DATA KEUANGAN USER SAAT INI: \n"
            f"Total Pemasukkan: Rp.{total_income:,}\n"
            f"Total Pengeluaran: Rp.{total_expense:,}\n"
            f"Sisa Saldo: Rp.{balance:,}\n"
            f"Transaksi Terakhir:\n {recent_transaction_str}"
            f"[INSTRUKSI KHUSUS : Gunakan data di atas untuk memberikan saran keuangan]"
            f"Jika saldo minus atau tipis, marahi user"
        )

        return summary
