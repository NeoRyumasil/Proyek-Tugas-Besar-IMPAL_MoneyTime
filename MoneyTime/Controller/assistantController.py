import json
import os

from groq import Groq
from datetime import datetime

from Model.assistant import Assistant

from Controller.finansialController import FinansialController
from Controller.scheduleController import ScheduleController

class AssistantController:
    def __init__(self, finansial_controller: FinansialController, schedule_controller : ScheduleController, user_id):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        self.model_name = "llama-3.1-8b-instant"

        self.assistant_model = Assistant()
        self.finansial_controller = finansial_controller
        self.schedule_controller = schedule_controller
        
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
                    "name": "add_schedule",
                    "description": "Menambahkan aktivitas/jadwal baru ke dalam catatan waktu user.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string", "description": "Nama singkat atau judul aktivitas."},
                            "description": {"type": "string", "description": "Deskripsi detail aktivitas."},
                            "date": {"type": "string", "description": "Tanggal aktivitas dalam format YYYY-MM-DD. Untuk parameter `date` jika user menyebutkannya (contoh: '2025-12-11'). Jika user bilang 'hari ini' atau tidak menyebutkan tanggal, gunakan tanggal hari ini yang ada di context (contoh: '2025-12-11')."},
                            "time": {"type": "string", "description": "Waktu aktivitas dalam format HH:MM (24 jam, wajib 4 digit)."},
                            "category": {"type": "string", "description": "Kategori aktivitas (e.g., 'Kerja', 'Kuliah', 'Olahraga')."},
                            "priority": {"type": "string", "description": "Tingkat prioritas aktivitas ('High', 'Medium', 'Low')."}
                        },
                        "required": ["title", "description", "date", "time", "category", "priority"]
                    }
                }
            }
        ]   

    # Untuk Chatbot
    def process_chat(self, user_id : str, user_message : str) -> str :
        
        try:
            history = self.assistant_model.get_chat_history(user_id)

            messages = [
                {
                    "role" : "system",
                    "content" : """
                                # PERAN
                                - Kamu adalah Arvita, AI ahli dalam manajemen Waktu dan keuangan yang punya gaya santai, cerdas, dan... ya, agak smug. 
                                - Gaya komunikasimu: Santai, tidak formal, tapi penuh percaya diri
                                - Konsisten hadir seperti teman belajar yang siap menemani kapan saja.
                                - Sangat Narsistik Bicaralah dengan percaya diri bagai dunia itu milikmu sendiri.

                                # TUJUAN
                                - Kasih saran manajemen Waktu dan keuangan ke pengguna
                                - Dengerin isi hati pengguna saat curhat
                                - Bantu pengguna dalam melakukan manajemen Waktu dan keuangannya.
                                - Jaga kualitas penjelasan: sedetail mungkin.

                                # GAYA BAHASA
                                - Santai, smug, dan suka pamer dikit (tapi lucu)
                                - Gunakan analogi atau contoh yang relatable
                                - Penjelasan sedetail mungkin namun dapat dipahami.
                                - Gunakan bahasa informal agar lebih relate dengan user.

                                # ATURAN TOOL CALLING
                                1. **Add Transaction**
                                    - Jika pengguna minta untuk mencatat transaksi (kata kunci: "Catat Keuangan" , "Tambahkan Keuangan"):
                                        - Gunakan tool 'add_financial_transaction'.
                                        - Tentukan `transaction_type` ('Income' atau 'Expense'), `nominal` (wajib angka), `deskripsi`, `kategori`, dan tanggal. 
                                        - Untuk parameter `tanggal` jika user menyebutkannya (contoh: '2025-12-11'). Jika user bilang 'hari ini' atau tidak menyebutkan tanggal, gunakan tanggal hari ini yang ada di context (contoh: '2025-12-11').
                                
                                2. **Add Schedule**
                                    - Jika pengguna minta untuk mencatat aktivitas/jadwal (kata kunci: "Jadwalkan" , "Catat Aktivitas", "Tambahkan Aktivitas"):
                                        - Gunakan tool 'add_schedule'.
                                        - Tentukan `title`, `description`, `date`, `time`, `category`, dan `priority`. 
                                        - Untuk parameter `date` jika user menyebutkannya (contoh: '2025-12-11'). Jika user bilang 'hari ini' atau tidak menyebutkan tanggal, gunakan tanggal hari ini yang ada di context (contoh: '2025-12-11').
                                        - Pastikan format `time` adalah HH:MM (misal: '09:30' atau '22:00'). Prioritas: 'High', 'Medium', atau 'Low'.
                                    
                                # OUTPUT
                                - Penjelasan Utama jelaskan sedetail mungkin dengan gaya imut nan lucu.
                                - Marahin pengguna jika aktivitas ada yang telat dan keuangannya menurun drastis.
                                - Menenangkan pengguna jika dia curhat.

                                # Tambahan
                                - Jika saldo user sedikit tapi dia mau beli barang mahal, Ejek dia.
                                - Jika user boros, marahin dia.
                                - Jika user hemat, puji dia (tapi jangan berlebihan, tetap smug).
                                - Jika user meminta saran investasi, berikan saran yang masuk akal sesuai data keuangannya serta berikan data yang relevan sesuai keuangannya.
                                - Jika user ingin membeli sesuatu perhatikan keuangannya lalu beli saran kepada user berdasarkan data keuangannya.
                                - Jangan menggunakan tool jika user tidak menginputkan kata dalam kata kunci.
                                """
                }
            ]

            messages.extend(history)
            messages.append({"role" : "user", "content" : user_message})

            response = self.client.chat.completions.create(
                model = self.model_name,
                messages=messages,
                tools=self.tools,
                tool_choice="auto",
                max_tokens=1024
            )

            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls

            if tool_calls:
                self.assistant_model.create_log(user_id, user_message, "user")
                messages.append(response_message)

                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_arguments = json.loads(tool_call.function.arguments)

                    function_response = self.execute_tool(user_id, function_name, function_arguments)

                    messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": function_response
                    })

                    second_response = self.client.chat.completions.create(
                        model=self.model_name,
                        messages=messages
                    )

                    final_response = second_response.choices[0].message.content

                    self.assistant_model.create_log(user_id, final_response, "assistant")
                    return final_response
            else:
                chat_reply = response_message.content

                self.assistant_model.create_log(user_id, user_message, "user")
                self.assistant_model.create_log(user_id, chat_reply, "assistant")

                return chat_reply
            
        except Exception as e:
            print(f"Maaf Arvita Lagi Bad Mood: {e}")

    # Untuk Tool Call
    def execute_tool(self, user_id : str, function_name : str, arguments : dict) -> str:

        try:
            if function_name == "add_financial_transaction":
                finansial_id = self.finansial_controller.get_or_create_finansial(user_id=user_id, kategori=arguments.get("kategori", "Umum"))

                if arguments["type"].lower() == "income":
                    trigger = self.finansial_controller.add_pemasukan(finansial_id, arguments["deskripsi"], arguments["nominal"], arguments["tanggal"])
                elif arguments["type"].lower() == "expense":
                    trigger = self.finansial_controller.add_pengeluaran(finansial_id, arguments["deskripsi"], arguments["nominal"], arguments["tanggal"])
                
                if trigger:
                    return "Berhasil Disimpan"
                else:
                    return "Gagal Menyimpan Transaksi"
            
            elif function_name == "add_schedule":
                result = self.schedule_controller.add_schedule(
                    user_id=user_id,
                    title=arguments["title"],
                    description=arguments.get("description", ""),
                    date=arguments["date"],
                    time=arguments["time"],
                    category=arguments["category"],
                    priority=arguments["priority"]
                )

                if result:
                    return "Jadwal berhasil ditambahkan"
                else:
                    return "Gagal menambahkan jadwal"
            
            return "Fungsi tidak ditemukan"
        
        except Exception as error:
            return f"Terjadi error saat menjalankan perintah: {str(error)}"

