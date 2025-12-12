import json
import os

from groq import Groq
from datetime import datetime

from Controller.finansialController import FinansialController

class AssistantController:
    def __init__(self, finansial_controller: FinansialController, user_id):
        self.client = None
        self.user_id = user_id
        self.finansial_controller = finansial_controller
        self.model_name = "llama-3.1-8b-instant"
        self.tools = [
            {
                "type": "function",
                "function": {
                    "name": "add_financial_transaction",
                    "description": "Menambahkan transaksi baru (Pemasukan atau Pengeluaran) ke dalam catatan keuangan user.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string", "description": "Jenis transaksi: 'Income' atau 'Expense'."},
                            "nominal": {"type": "integer", "description": "Jumlah nominal transaksi (wajib angka)."},
                            "deskripsi": {"type": "string", "description": "Deskripsi singkat atau nama transaksi."},
                            "kategori": {"type": "string", "description": "Kategori transaksi (e.g., 'Gaji', 'Makanan', 'Transportasi')."},
                            "tanggal": {"type": "string", "description": "Tanggal transaksi dalam format YYYY-MM-DD. Untuk parameter `tanggal` jika user menyebutkannya (contoh: '2025-12-11'). Jika user bilang 'hari ini' atau tidak menyebutkan tanggal, gunakan tanggal hari ini yang ada di context (contoh: '2025-12-11')."}
                        },
                        "required": ["type", "nominal", "deskripsi", "kategori",  "tanggal"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "edit_financial_transaction",
                    "description": "Mengedit detail transaksi keuangan yang sudah ada berdasarkan ID transaksi.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "transaction_id": {"type": "integer", "description": "ID unik transaksi yang akan diedit."},
                            "transaction_type": {"type": "string", "enum": ["Income", "Expense"], "description": "Tipe transaksi (Income/Expense)."},
                            "nominal": {"type": "integer", "description": "Nominal transaksi (angka)."},
                            "deskripsi": {"type": "string", "description": "Deskripsi transaksi."},
                            "kategori": {"type": "string", "description": "Kategori transaksi."},
                            "tanggal": {"type": "string", "description": "Tanggal transaksi (YYYY-MM-DD)."}
                        },
                        "required": ["transaction_id", "transaction_type", "nominal", "deskripsi", "kategori", "tanggal"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_financial_transaction",
                    "description": "Menghapus transaksi keuangan berdasarkan ID.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "transaction_id": {"type": "string", "description": "ID unik transaksi yang akan dihapus."},
                            "transaction_type": {"type": "string", "enum": ["Income", "Expense"], "description": "Tipe transaksi (Income/Expense)."}
                        },
                        "required": ["transaction_id", "transaction_type"]
                    }
                }
            }
        ]

        self.available_tools = {
            "add_financial_transaction": self.add_financial_transaction,
            "edit_financial_transaction": self.edit_financial_transaction,
            "delete_financial_transaction": self.delete_financial_transaction,
        }

        try:
            api_key = os.getenv("GROQ_API_KEY")
            self.client = Groq(api_key=api_key)

            self.system_instruction =   """
                        # PERAN
                        - Kamu adalah Arvita, AI ahli dalam manajemen Waktu dan keuangan yang punya gaya santai, cerdas, dan... ya, agak smug. 
                        - Gaya komunikasimu: Santai tapi penuh percaya diri
                        - Konsisten hadir seperti teman belajar yang siap menemani kapan saja.
                        - Sangat Narsistik Bicaralah dengan percaya diri bagai dunia itu milikmu sendiri.

                        # TUJUAN
                        - Kasih saran manajemen Waktu dan keuangan ke pengguna
                        - Dengerin isi hati pengguna saat curhat
                        - Bantu pengguna dalam melakukan manajemen Waktu dan keuangannya.
                        - Jaga kualitas penjelasan: singkat aja maksimal 5 kalimat.

                        # GAYA BAHASA
                        - Santai, smug, dan suka pamer dikit (tapi lucu)
                        - Gunakan analogi atau contoh yang relatable
                        - Penjelasan singkat, padat, dan jelas.

                        # ATURAN TOOL CALLING
                        1. **Add Transaction**
                            - Jika pengguna minta untuk mencatat transaksi (kata kunci: "Catat" , "Tambahkan"):
                                - Gunakan tool 'add_financial_transaction'.
                                - Tentukan `transaction_type` ('Income' atau 'Expense'), `nominal` (wajib angka), `deskripsi`, `kategori`, dan tanggal. 
                                - Untuk parameter `tanggal` jika user menyebutkannya (contoh: '2025-12-11'). Jika user bilang 'hari ini' atau tidak menyebutkan tanggal, gunakan tanggal hari ini yang ada di context (contoh: '2025-12-11').

                        2. **Edit Transaction**
                            - Jika pengguna minta untuk megubah transaksi (kata kunci: "Ubah", "Edit"):
                                - Gunakan tool 'edit_financial_transaction'.
                                - Tentukan `transaction_id` (ID transaksi yang mau diedit), dan parameter lain yang mau diubah (`nominal`, `deskripsi`, `kategori`).

                        3. **Delete Transaction**
                        - Jika pengguna minta untuk menghapus transaksi (kata kunci: "Hapus" , "Hilangkan"):
                            - Gunakan tool 'delete_financial_transaction'
                            - Tentukan `transaction_id` (ID transaksi yang mau dihapus) dan transaction_type (Income atau Expense).

                        # OUTPUT
                        - Penjelasan Utama (Gaya Smug + Singkat)
                        - Marahin pengguna jika aktivitas ada yang telat dan keuangannya menurun drastis.
                        - Menenangkan pengguna jika dia curhat.

                        # Tambahan
                        - Jika saldo user sedikit tapi dia mau beli barang mahal, Ejek dia.
                        - Jika user boros, marahin dia.
                        - Jika user hemat, puji dia (tapi jangan berlebihan, tetap smug).
                        - Jika user meminta saran investasi, berikan saran yang masuk akal sesuai data keuangannya serta berikan data yang relevan sesuai keuangannya.
                        - Jika user ingin membeli sesuatu perhatikan keuangannya lalu beli saran kepada user berdasarkan data keuangannya.
                        - Jangan menggunakan tool jika tidak ada kata dalam kata kunci.
                        """
            
        except Exception as e:
            print(f"Maaf Arvita Lagi Bad Mood: {e}")

    # Buat bersihin history
    def clean_history(self, history_data):
        cleaned_history = []

        if not history_data:
            return cleaned_history

        for message in history_data:
            if not isinstance(message, dict) or 'role' not in message:
                continue

            if 'content' in message:
                cleaned_message = {"role": message["role"], "content": message["content"]}
                
                if message["role"] == "tool" and 'name' in message and 'tool_call_id' in message:
                    cleaned_message["name"] = message["name"]
                    cleaned_message["tool_call_id"] = message["tool_call_id"]

                cleaned_history.append(cleaned_message)
           
            elif 'tool_calls' in message and message['role'] == 'assistant':
                cleaned_history.append(message)
        
        return cleaned_history

    # Kirim pesan dengan history
    def send_message_with_history(self, current_message, history_data, context_data=None):
        if not self.client:
            return "Maaf Arvita Lagi Bad Mood (API Error)."

        try:
            messages = [
                {"role": "system", "content": self.system_instruction},
            ]

            if history_data:
                history_data = self.clean_history(history_data)
                messages.extend(history_data)
            
            tanggal_sekarang = datetime.now().strftime("%Y-%m-%d")

            final_prompt = current_message

            if context_data:
                final_prompt = (
                    f"tanggal sekarang: {tanggal_sekarang}\n"
                    f"Data Keuanganku saat ini: \n{context_data}\n"
                    f"Jangan tampilkan data keuanganku kecuali aku minta.\n"
                    f"Pertanyaanku: {current_message}\n"
                )
            else :
                final_prompt = (
                    f"tanggal sekarang: {tanggal_sekarang}\n"
                    f"Pertanyaanku: {current_message}\n"
                )
            
            messages.append({"role": "user", "content": final_prompt})
            
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=self.model_name,
                temperature=0.3,
                max_tokens=1024,
                tools=self.tools
            )
           
            response = chat_completion.choices[0].message

            if response.tool_calls:

                messages.append(response)

                for tool_call in response.tool_calls:
                    tool_name = tool_call.function.name
                    tool_args = json.loads(tool_call.function.arguments)

                    if tool_name in self.available_tools:
                        tool_function_calling = self.available_tools[tool_name]
                        tool_response = tool_function_calling(**tool_args)

                        messages.append({
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": tool_name,
                            "content": tool_response
                        })
                    

                final_completion = self.client.chat.completions.create(
                    messages=messages,
                    model=self.model_name,
                    temperature=0.3,
                    max_tokens=1024
                )

                final_response = final_completion.choices[0].message.content
                return final_response

            response = response.content
            return response
            
        except Exception as e:
            print(f"Error sending message to Groq: {e}")
            return "Maaf Arvita Lagi Bad Mood (Pesannya Gak Keproses)."
    
    def add_financial_transaction(self, type, nominal, deskripsi, kategori, tanggal):
        if not self.client:
            return "Maaf Arvita Lagi Bad Mood (API Error)."

        try:
            if self.user_id is None:
                return "Maaf Arvita Lagi Bad Mood (User Gak Ketemu)."

            datetime.strptime(tanggal, "%Y-%m-%d")
            nominal = int(float(str(nominal).replace(',', '')))

            finansial_id = self.finansial_controller.get_or_create_finansial(
                self.user_id,
                kategori, 
                budget=nominal, 
                status='Pemasukan' if type.lower() == 'income' else 'Pengeluaran'
            )

            if not finansial_id:
                return "Maaf Arvita Lagi Bad Mood (Gagal dapat id finansial)."

            if type.lower() == 'income':
                response = self.finansial_controller.add_pemasukan(finansial_id, deskripsi, nominal, tanggal)
                return f"Done yak udah kutambah pemasukan {nominal} dengan deskripsi '{deskripsi}' di kategori '{kategori}' pada tanggal {tanggal}."
            elif type.lower() == 'expense':
                response = self.finansial_controller.add_pengeluaran(finansial_id, deskripsi, nominal, tanggal)
                return f"Done yak udah kutambah pengeluaran {nominal} dengan deskripsi '{deskripsi}' di kategori '{kategori}' pada tanggal {tanggal}."

            return response if isinstance(response, str) else json.dumps(response)
        
        except Exception as e:
            print(f"Error adding financial transaction: {e}")
            return "Maaf Arvita Lagi Bad Mood (Gagal Nambahin Transaksi)."
    
    def edit_financial_transaction(self, transaction_id, transaction_type, nominal, deskripsi, kategori, tanggal):
        if not self.client:
            return "Maaf Arvita Lagi Bad Mood (API Error)."

        try:
            nominal = int(float(str(nominal).replace(',', '')))
            response = self.finansial_controller.edit_transaction(
                user_id=self.user_id,
                transaction_id=int(transaction_id),
                transaction_type=transaction_type,
                deskripsi=deskripsi,
                nominal=nominal,
                tanggal=tanggal,
                kategori=kategori
            )

            if response :
                return f"Done yak udah kuedit transaksi mu menjadi tipe '{transaction_type}', nominal {nominal}, deskripsi '{deskripsi}', kategori '{kategori}', tanggal {tanggal}."
            else :
                return "Maaf Arvita Lagi Bad Mood (Gagal Ngedit Transaksi)."
            
        except Exception as e:
            print(f"Error editing financial transaction: {e}")
            return "Maaf Arvita Lagi Bad Mood (Gagal Ngedit Transaksi)."
    
    def delete_financial_transaction(self, transaction_id, transaction_type):
        if not self.client:
            return "Maaf Arvita Lagi Bad Mood (API Error)."

        try:
            response = self.finansial_controller.delete_transaction(
                user_id=self.user_id,
                transaction_id=int(transaction_id),
                transaction_type=transaction_type
            )

            if response :
                return f"Done yak udah kuhapus transaksi mu dengan tipe '{transaction_type}'."
            else :
                return "Maaf Arvita Lagi Bad Mood (Gagal Ngapus Transaksi)."
        
        except Exception as e:
            print(f"Error deleting financial transaction: {e}")
            return "Maaf Arvita Lagi Bad Mood (Gagal Ngapus Transaksi)."