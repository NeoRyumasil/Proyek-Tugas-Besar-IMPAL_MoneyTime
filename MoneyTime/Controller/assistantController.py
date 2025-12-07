# Controller/assistantController.py
import json
import google.generativeai as genai
import os

class AssistantController:
    def __init__(self):
        self.model = None
        try:
            # Pastikan path benar. Gunakan os.path.join agar aman
            base_path = os.path.dirname(os.path.abspath(__file__)) # Folder Controller
            project_path = os.path.dirname(base_path) # Folder MoneyTime
            key_path = os.path.join(project_path, 'api_key.json')
            
            with open(key_path, 'r') as f:
                api_data = json.load(f)
            
            genai.configure(api_key=api_data["key"])
            self.model = genai.GenerativeModel('gemini-2.5-flash') # Gunakan model yang valid/umum
            
        except Exception as e:
            print(f"Error initializing AssistantController: {e}")

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