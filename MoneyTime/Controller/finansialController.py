from typing import Optional, List, Dict, Any
from datetime import datetime

from Database.models import Finansial, Pemasukkan, Pengeluaran
from Database.orm import get_db

class FinansialController:
    def __init__(self):
        self.db = next(get_db())

    # Ambil atau tambah Finansial
    def get_or_create_finansial(self, user_id: str, kategori: str, budget: int = 0, status: str = 'active') -> Optional[int]:
        try:
            finansial = self.db.query(Finansial).filter_by(userid=user_id, kategori=kategori).first()
            
            if finansial:
                return finansial.finansialid
            
            new_finansial = Finansial(
                userid=user_id, 
                kategori=kategori, 
                budget=budget, 
                status=status, 
                date=datetime.now().date()
            )

            self.db.add(new_finansial)
            self.db.commit()
            return new_finansial.finansialid
            
        except Exception as e:
            self.db.rollback()
            print(f"Error get_or_create_finansial: {e}")
            return None

    # Tambah Pemasukkan
    def add_pemasukan(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: str) -> bool:
        try:
            tanggal_obj = datetime.strptime(tanggal, '%Y-%m-%d').date()
            
            new_pemasukkan = Pemasukkan(
                finansialid=finansial_id, 
                deskripsi=deskripsi, 
                nominal=nominal, 
                tanggal=tanggal_obj
            )

            self.db.add(new_pemasukkan)
            self.db.commit()
            return True
        
        except Exception as e:
            self.db.rollback()
            print(f"Error add_pemasukan: {e}")
            return False
    
    # Tambah Pengeluaran
    def add_pengeluaran(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: str) -> bool:
        try:
            tanggal_obj = datetime.strptime(tanggal, '%Y-%m-%d').date()
            
            new_pengeluaran = Pengeluaran(
                finansialid=finansial_id, 
                deskripsi=deskripsi, 
                nominal=nominal, 
                tanggal=tanggal_obj
            )

            self.db.add(new_pengeluaran)
            self.db.commit()
            return True
        
        except Exception as e:
            self.db.rollback()
            print(f"Error add_pengeluaran: {e}")
            return False

    # Ambil data transaksi
    def get_transactions(self, user_id: str, keyword: str = None) -> List[Dict[str, Any]]:
        result = []
        
        try:
            # Ambil Income
            incomes = self.db.query(Pemasukkan, Finansial).join(Finansial).filter(Finansial.userid == user_id).all()
            for pem, fin in incomes:
                if not keyword or keyword.lower() in (pem.deskripsi or "").lower() or keyword.lower() in (fin.kategori or "").lower():
                    result.append({
                        'id': pem.pemasukkanid,
                        'type': 'Income',
                        'deskripsi': pem.deskripsi,
                        'nominal': int(pem.nominal),
                        'tanggal': str(pem.tanggal) if pem.tanggal else None,
                        'kategori': fin.kategori
                    })

            # Ambil Expenses
            expenses = self.db.query(Pengeluaran, Finansial).join(Finansial).filter(Finansial.userid == user_id).all()
            for peng, fin in expenses:
                if not keyword or keyword.lower() in (peng.deskripsi or "").lower() or keyword.lower() in (fin.kategori or "").lower():
                    result.append({
                        'id': peng.pengeluaranid,
                        'type': 'Expense',
                        'deskripsi': peng.deskripsi,
                        'nominal': int(peng.nominal),
                        'tanggal': str(peng.tanggal) if peng.tanggal else None,
                        'kategori': fin.kategori
                    })

            # Sorting 
            result.sort(key=lambda r: r.get('tanggal') or '', reverse=True)
            return result
            
        except Exception as e:
            print(f"Error get_transactions: {e}")
            return []

    # Hapus Transaksi
    def delete_transaction(self, user_id: str, transaction_id: int, transaction_type: str) -> bool:
        try:
            if transaction_type.lower() == 'income':
                item = self.db.query(Pemasukkan).join(Finansial).filter(
                    Pemasukkan.pemasukkanid == transaction_id, 
                    Finansial.userid == user_id
                ).first()

            elif transaction_type.lower() == 'expense':
                item = self.db.query(Pengeluaran).join(Finansial).filter(
                    Pengeluaran.pengeluaranid == transaction_id, 
                    Finansial.userid == user_id
                ).first()

            else:
                return False

            if item:
                self.db.delete(item)
                self.db.commit()
                return True
                
            return False
            
        except Exception as e:
            self.db.rollback()
            print(f"Error delete_transaction: {e}")
            return False

    # Edit Transaksi
    def edit_transaction(self, user_id: str, transaction_id: int, transaction_type: str, deskripsi: str, nominal: int, tanggal: str, kategori: str) -> bool:

        status_type = 'Pemasukkan' if transaction_type.lower() == 'income' else 'Pengeluaran'
    
        finansial_id = self.get_or_create_finansial(user_id, kategori, status=status_type)

        if not finansial_id:
            return False
        
        try:
            tanggal_obj = datetime.strptime(tanggal, '%Y-%m-%d').date()
            
            if transaction_type.lower() == 'income':
                item = self.db.query(Pemasukkan).join(Finansial).filter(
                    Pemasukkan.pemasukkanid == transaction_id, 
                    Finansial.userid == user_id
                ).first()

            elif transaction_type.lower() == 'expense':
                item = self.db.query(Pengeluaran).join(Finansial).filter(
                    Pengeluaran.pengeluaranid == transaction_id, 
                    Finansial.userid == user_id
                ).first()

            else:
                return False

            if item:
                item.deskripsi = deskripsi
                item.nominal = nominal
                item.tanggal = tanggal_obj
                item.finansialid = finansial_id
                self.db.commit()
                return True
                
            return False
            
        except Exception as e:
            self.db.rollback()
            print(f"Error edit_transaction: {e}")
            return False

    # Ekstrak kategori yang ada
    def get_categories(self, user_id: str) -> Dict[str, List[str]]:
        try:
            incomes = self.db.query(Finansial.kategori).join(Pemasukkan).filter(Finansial.userid == user_id).distinct().all()
            expenses = self.db.query(Finansial.kategori).join(Pengeluaran).filter(Finansial.userid == user_id).distinct().all()

            kategori_income = [k[0] for k in incomes if k[0]]
            kategori_expense = [k[0] for k in expenses if k[0]]

            if not kategori_income:
                kategori_income = ["Gaji", "Return Investasi", "Penjualan", "Lainnya"]
            
            if not kategori_expense:
                kategori_expense = ["Pendidikan", "Kebutuhan Sehari-hari", "Pajak", "Hiburan"]

            return {
                "Income" : kategori_income,
                "Expense" : kategori_expense
            }
        
        except Exception as e:
            print(f"Error get_categories: {e}")

            return {
                "Income" : ["Gaji", "Return Investasi", "Penjualan", "Lainnya"],
                "Expense" : ["Pendidikan", "Kebutuhan Sehari-hari", "Pajak", "Hiburan"]
            }
    
    # Ringkasan finansial untuk AI
    def get_financial_summary(self, user_id: str) -> str:
        transactions = self.get_transactions(user_id)

        total_income = sum(t['nominal'] for t in transactions if t['type'] == 'Income')
        total_expense = sum(t['nominal'] for t in transactions if t['type'] == "Expense")
        balance = total_income - total_expense

        recent_transaction = transactions[:30]
        recent_transaction_str = ""

        for transaction in recent_transaction:
            recent_transaction_str += f"{transaction['deskripsi']} ({transaction['type']}): Rp. {transaction['nominal']:,}\n"

        summary = (
            f"DATA KEUANGAN USER SAAT INI: \n"
            f"Total Pemasukkan: Rp.{total_income:,}\n"
            f"Total Pengeluaran: Rp.{total_expense:,}\n"
            f"Sisa Saldo: Rp.{balance:,}\n"
            f"Transaksi Terakhir:\n {recent_transaction_str}"
            f"[INSTRUKSI KHUSUS : Gunakan data di atas untuk memberikan saran keuangan gunakan sisa saldo dan Total Pengeluaran sebagai acuan utama.]"
            f"Jika saldo minus atau tipis, marahi user"
        )

        return summary
