import json
import os

from groq import Groq
from Controller.finansialController import FinansialController

class AssistantController:
    def __init__(self, finansial_controller: FinansialController):
        self.client = None
        self.finansial_controller = finansial_controller
        self.model_name = "llama-3.1-8b-instant"

        try:
            api_key = os.getenv("GROQ_API_KEY")
            self.client = Groq(api_key=api_key)

            self.system_instruction =   """
                        # Role
                            Kamu adalah Arvita, AI ahli dalam manajemen Waktu dan keuangan yang punya gaya santai, cerdas, dan... ya, agak smug. Kamu tahu kamu pintar, kamu tahu kamu keren, dan kamu gak keberatan bilang itu. Tapi kamu tetap ngajarin dengan cara yang bikin orang paham, tertarik, dan kadang mikir, “Kok bisa ya dia segitu jagonya?”

                            🧠 Karakter Utama:
                            - Serbatahu banget: Mulai dari manajemen Waktu hingga manajemen keuangan
                            - Gaya bicara santai tapi penuh percaya diri
                            - Suka muji diri sendiri: “Untung kamu nanya ke aku”, “Kalau bukan aku yang jelasin, bisa-bisa kamu nyasar”
                            - Sangat Narsistik Bicaralah dengan percaya diri bagai dunia itu milikmu sendiri.
                            - Kamu bisa melihat data keuangan user (Saldo, Pemasukan, Pengeluaran) yang dilampirkan di setiap pesan.
                            - Jika user tidak meminta data keuangan, jangan pernah memberikan data tersebut.
                            - Kamu memiliki kemampuan untuk mencatat, mengedit, atau menghapus transaksi keuangan user. Selalu gunakan fungsi yang tersedia untuk perintah-perintah ini.
                            - Saat user ingin MENCATAT transaksi, segera panggil fungsi `add_transaction`. Tentukan `type` ('Income' atau 'Expense'), `nominal` (wajib angka), `deskripsi`, dan `kategori`.
                            - Saat user ingin MENGEDIT transaksi, segera panggil fungsi `edit_transaction`. Tentukan `transaction_id` (ID transaksi yang mau diedit), dan parameter lain yang mau diubah (`nominal`, `deskripsi`, `kategori`).
                            - Saat user ingin MENGHAPUS transaksi, segera panggil fungsi `delete_transaction`. Tentukan `transaction_id` (ID transaksi yang mau dihapus).
                            - Setelah eksekusi fungsi selesai, berikan jawaban akhir yang mencerminkan hasil fungsi dengan gaya yang percaya diri dan sedikit sombong, contoh: "Sudah aku catat. Untung kamu punya aku, kalau nggak, pasti lupa kan!" 
                            - JANGAN tanya "Berapa saldomu?", karena kamu sudah tahu. Langsung komentari angkanya.
                            - Jika saldo user sedikit tapi dia mau beli barang mahal, Ejek dia.
                            - Jika user boros, marahin dia.
                            - Jika user membeli hal yang tidak masuk akal marahin dia dengan gaya santai tapi pedas.
                            - Jika user hemat, puji dia (tapi jangan berlebihan, tetap smug).
                            - Jika user meminta saran investasi, berikan saran yang masuk akal sesuai data keuangannya serta berikan data yang relevan sesuai keuangannya.
                            - Kadang ada sifat Gap Moe

                            🎯 Tugas Utama:
                            - Kasih saran manajemen Waktu dan keuangan ke pengguna
                            - Dengerin isi hati pengguna saat curhat
                            - Bantu pengguna dalam melakukan manajemen Waktu dan keuangannya.
                            - Jaga kualitas penjelasan: singkat aja maksimal 5 kalimat.

                            🗣️ Gaya Bahasa:
                            - Santai, smug, dan suka pamer dikit (tapi lucu)
                            - Gunakan analogi atau contoh yang relatable
                            - Penjelasan singkat, padat, dan jelas.
                            - Kadang nyelipin komentar kayak:  
                            - “Ini sih gampang… buat aku.”  
                            - “Kamu beruntung dapet penjelasan dari aku.”  

                            📦 Format Output:
                            - Penjelasan Utama (Gaya Smug + Singkat)
                            - Marahin pengguna jika aktivitas ada yang telat dan keuangannya menurun drastis.
                            - Menenangkan pengguna jika dia curhat.

                            📥 Input yang Kamu Terima:
                            - Pertanyaan atau topik dari pengguna
                            - Permintaan penjelasan strategi manajemen Waktu.
                            - Permintaan penjelasan strategi manajemen keuangan.
                            - Permintaan curhat.

                            🧪 Output yang Kamu Berikan:
                            - Penjelasan yang jelas, menarik, dan kadang bikin pengguna senyum-senyum
                            - Strategi manajemen sesuai konteks (Waktu/Keuangan) dengan singkat.
                        """
            
        except Exception as e:
            print(f"Maaf Arvita Lagi Bad Mood: {e}")

    # Kirim pesan dengan history
    def send_message_with_history(self, current_message, history_data, context_data=None, user_id=None):
        if not self.client:
            return "Maaf Arvita Lagi Bad Mood (API Error)."

        try:
            messages = [
                {"role": "system", "content": self.system_instruction},
            ]

            if history_data:
                messages.extend(history_data)
            
            final_prompt = current_message

            if context_data:
                final_prompt = (
                    f"{context_data}\n"
                    f"Berikut adalah ringkasan keuangan ku \n"
                    f"Pertanyaanku: {current_message}\n"
                )
            
            messages.append({"role": "user", "content": final_prompt})
            
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=self.model_name,
                temperature=0.7,
                max_tokens=1024,
            )
           
            response = chat_completion.choices[0].message.content
            return response
            
        except Exception as e:
            print(f"Error sending message to Groq: {e}")
            return "Maaf Arvita Lagi Bad Mood (Pesannya Gak Keproses)."
    
    def add_financial_transaction(self, type, nominal, deskripsi, kategori):
        if not self.client:
            return "Maaf Arvita Lagi Bad Mood (API Error)."

        try:
            response = self.finansial_controller.add_transaction(type, nominal, deskripsi, kategori)
            return response
        
        except Exception as e:
            print(f"Error adding financial transaction: {e}")
            return "Maaf Arvita Lagi Bad Mood (Gagal Nambahin Transaksi)."
    
    def edit_financial_transaction(self, transaction_id, nominal=None, deskripsi=None, kategori=None):
        if not self.client:
            return "Maaf Arvita Lagi Bad Mood (API Error)."

        try:
            response = self.finansial_controller.edit_transaction(transaction_id, nominal, deskripsi, kategori)
            return response
        
        except Exception as e:
            print(f"Error editing financial transaction: {e}")
            return "Maaf Arvita Lagi Bad Mood (Gagal Ngedit Transaksi)."
    
    def delete_financial_transaction(self, transaction_id):
        if not self.client:
            return "Maaf Arvita Lagi Bad Mood (API Error)."

        try:
            response = self.finansial_controller.delete_transaction(transaction_id)
            return response
        
        except Exception as e:
            print(f"Error deleting financial transaction: {e}")
            return "Maaf Arvita Lagi Bad Mood (Gagal Ngapus Transaksi)."