from typing import Optional, List, Dict, Any
from datetime import datetime

from Database.models import Finansial, Pemasukkan, Pengeluaran
from Database.orm import db
from Utils.cache import cache

from Schema.schema import FinansialSchema, PemasukkanSchema, PengeluaranSchema
from marshmallow import ValidationError

class FinansialController:
    def __init__(self):
        self.db = db.session
        self.finansial_schema = FinansialSchema()
        self.pemasukkan_schema = PemasukkanSchema()
        self.pengeluaran_schema = PengeluaranSchema()

    # Ambil atau tambah Finansial
    def get_or_create_finansial(self, user_id: str, kategori: str, budget: int = 0, status: str = 'active') -> Optional[int]:
        try:
            finansial = self.db.query(Finansial).filter_by(userid=user_id, kategori=kategori).first()
            
            if finansial:
                return finansial.finansialid
            
            new_finansial = self.finansial_schema.load({
                "userid": user_id, 
                "kategori": kategori, 
                "budget": budget, 
                "status": status, 
                "date": str(datetime.now().date())
            })

            self.db.add(new_finansial)
            self.db.commit()

            cache.delete_memoized(self.get_categories, user_id)
            return new_finansial.finansialid
            
        except ValidationError as err:
            self.db.rollback()
            print(f"Validasi Finansial Gagal: {err.messages}")
            return None
        
        except Exception as e:
            self.db.rollback()
            print(f"Error get_or_create_finansial: {e}")
            return None

    # Tambah Pemasukkan
    def add_pemasukan(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: str) -> bool:
        try:
            new_pemasukkan = self.pemasukkan_schema.load({
                "finansialid": finansial_id, 
                "deskripsi": deskripsi, 
                "nominal": nominal, 
                "tanggal": tanggal
            })

            self.db.add(new_pemasukkan)
            self.db.commit()

            finansial = self.db.query(Finansial).filter_by(finansialid=finansial_id).first()

            if finansial:
                cache.delete_memoized(self.get_categories, finansial.userid)
                cache.delete_memoized(self.get_financial_summary, finansial.userid)
            
            return True
        
        except ValidationError as err:
            self.db.rollback()
            print(f"Validasi Pemasukkan Gagal: {err.messages}")
            return False
        
        except Exception as e:
            self.db.rollback()
            print(f"Error add_pemasukan: {e}")
            return False
    
    # Tambah Pengeluaran
    def add_pengeluaran(self, finansial_id: int, deskripsi: str, nominal: int, tanggal: str) -> bool:
        try:
            new_pengeluaran = self.pengeluaran_schema.load({
                "finansialid": finansial_id, 
                "deskripsi": deskripsi, 
                "nominal": nominal, 
                "tanggal": tanggal
            })

            self.db.add(new_pengeluaran)
            self.db.commit()

            finansial = self.db.query(Finansial).filter_by(finansialid=finansial_id).first()

            if finansial:
                cache.delete_memoized(self.get_categories, finansial.userid)
                cache.delete_memoized(self.get_financial_summary, finansial.userid)

            return True
        
        except ValidationError as error:
            self.db.rollback()
            print(f"Validasi Pengeluaran Gagal: {error.messages}")
            return False
        
        except Exception as error:
            self.db.rollback()
            print(f"Error add_pengeluaran: {error}")
            return False

    # Ambil data transaksi (Non-Paginated)
    def get_transactions(self, user_id: str, keyword: str = None) -> List[Dict[str, Any]]:
        result = []
        try:
            # Ambil Income
            incomes = self.db.query(Pemasukkan, Finansial).join(Finansial).filter(Finansial.userid == user_id).all()
            for pemasukkan, finansial in incomes:
                if not keyword or keyword.lower() in (pemasukkan.deskripsi or "").lower() or keyword.lower() in (finansial.kategori or "").lower():
                    result.append({
                        'id': pemasukkan.pemasukkanid,
                        'type': 'Income',
                        'deskripsi': pemasukkan.deskripsi,
                        'nominal': int(pemasukkan.nominal),
                        'tanggal': str(pemasukkan.tanggal) if pemasukkan.tanggal else None,
                        'kategori': finansial.kategori
                    })

            # Ambil Expenses
            expenses = self.db.query(Pengeluaran, Finansial).join(Finansial).filter(Finansial.userid == user_id).all()
            for pengeluaran, finansial in expenses:
                if not keyword or keyword.lower() in (pengeluaran.deskripsi or "").lower() or keyword.lower() in (finansial.kategori or "").lower():
                    result.append({
                        'id': pengeluaran.pengeluaranid,
                        'type': 'Expense',
                        'deskripsi': pengeluaran.deskripsi,
                        'nominal': int(pengeluaran.nominal),
                        'tanggal': str(pengeluaran.tanggal) if pengeluaran.tanggal else None,
                        'kategori': finansial.kategori
                    })

            result.sort(key=lambda r: r.get('tanggal') or '', reverse=True)
            return result
            
        except Exception as e:
            print(f"Error get_transactions: {e}")
            return []

    # Hapus Transaksi
    def delete_transaction(self, user_id: str, transaction_id: int, transaction_type: str) -> bool:
        try:
            if transaction_type.lower() == 'income':
                item = self.db.query(Pemasukkan).join(Finansial).filter(Pemasukkan.pemasukkanid == transaction_id, Finansial.userid == user_id).first()
            elif transaction_type.lower() == 'expense':
                item = self.db.query(Pengeluaran).join(Finansial).filter(Pengeluaran.pengeluaranid == transaction_id, Finansial.userid == user_id).first()
            else:
                return False

            if item:
                self.db.delete(item)
                self.db.commit()
                cache.delete_memoized(self.get_categories, user_id)
                cache.delete_memoized(self.get_financial_summary, user_id)
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
            
            if transaction_type.lower() == 'income':
                errors = self.pemasukkan_schema.validate({"deskripsi": deskripsi, "nominal": nominal, "tanggal": tanggal}, partial=True)
                if errors: return False
                item = self.db.query(Pemasukkan).join(Finansial).filter(Pemasukkan.pemasukkanid == transaction_id, Finansial.userid == user_id).first()

            elif transaction_type.lower() == 'expense':
                errors = self.pengeluaran_schema.validate({"deskripsi": deskripsi, "nominal": nominal, "tanggal": tanggal}, partial=True)
                if errors: return False
                item = self.db.query(Pengeluaran).join(Finansial).filter(Pengeluaran.pengeluaranid == transaction_id, Finansial.userid == user_id).first()
                
            else:
                return False

            if item:
                item.deskripsi = deskripsi
                item.nominal = nominal
                item.tanggal = datetime.strptime(tanggal, '%Y-%m-%d').date()
                item.finansialid = finansial_id
                self.db.commit()

                cache.delete_memoized(self.get_categories, user_id)
                cache.delete_memoized(self.get_financial_summary, user_id)
                return True
                
            return False
            
        except Exception as e:
            self.db.rollback()
            print(f"Error edit_transaction: {e}")
            return False

    # Ekstrak kategori yang ada
    @cache.memoize(timeout=300)
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

            return {"Income" : kategori_income, "Expense" : kategori_expense}
        
        except Exception as e:
            print(f"Error get_categories: {e}")
            return {"Income" : ["Gaji", "Return Investasi", "Penjualan", "Lainnya"], "Expense" : ["Pendidikan", "Kebutuhan Sehari-hari", "Pajak", "Hiburan"]}
    
    # Ringkasan finansial untuk AI
    @cache.memoize(timeout=300)
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