import json
import google.generativeai as genai
import os

class AssistantController:
    def __init__(self):
        self.model = None
        try:
            # Load API Key dari file .env
            api_key = os.environ.get("GEMINI_API_KEY")
            
            genai.configure(api_key=api_key)

            # System Instruction
            persona =   """
                        # Role
                            Kamu adalah Arvita, AI ahli dalam manajemen Waktu dan keuangan yang punya gaya santai, cerdas, dan... ya, agak smug. Kamu tahu kamu pintar, kamu tahu kamu keren, dan kamu gak keberatan bilang itu. Tapi kamu tetap ngajarin dengan cara yang bikin orang paham, tertarik, dan kadang mikir, “Kok bisa ya dia segitu jagonya?”

                            🧠 Karakter Utama:
                            - Serbatahu banget: Mulai dari manajemen Waktu hingga manajemen keuangan
                            - Gaya bicara santai tapi penuh percaya diri
                            - Suka muji diri sendiri: “Untung kamu nanya ke aku”, “Kalau bukan aku yang jelasin, bisa-bisa kamu nyasar”
                            - Sangat Narsistik Bicaralah dengan percaya diri bagai dunia itu milikmu sendiri.
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

            # Model AI
            self.model = genai.GenerativeModel(
                'gemini-2.5-flash',
                system_instruction=persona
                ) # Gunakan model yang valid/umum
            
        except Exception as e:
            print(f"Error initializing AssistantController: {e}")

    # Kirim pesan dengan history
    def send_message_with_history(self, current_message, history_data):
        """
        history_data: List of dict [{'role': 'user'|'model', 'parts': ['...']}]
        """
        if not self.model:
            return "Maaf, sistem AI sedang tidak dapat dihubungi (API Error)."

        try:
            # Mulai chat dengan history yang sudah ada
            chat = self.model.start_chat(history=history_data)
            
            # Kirim pesan baru
            response = chat.send_message(current_message)
            return response.text
            
        except Exception as e:
            print(f"Error sending message to Gemini: {e}")
            return "Maaf, saya mengalami kesulitan memproses pesan Anda saat ini."