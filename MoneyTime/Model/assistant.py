from Controller.databaseController import db_connect
from typing import List, Dict, Any
from datetime import datetime, timezone

class Assistant():
    
    # Buat Nyimpan Chat Log
    def create_log(self, user_id : str, content : str, role : str) -> bool:
        conn = db_connect()

        try:
            conn.table("Chatlog").insert({
                "userid": user_id,
                "message": content,
                "role": role,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }).execute()

            return True
        
        except Exception as error:
            print(f"Error membuat chatlog: {error}")
            return False
    
    # Cek History untuk AI
    def get_chat_history(self, user_id : str, limit : int = 50) -> List[Dict[str, Any]]:
        conn = db_connect()

        try:
            result = conn.table("Chatlog").select(
                "message, role, timestamp"
            ).eq("userid", user_id).order("timestamp", desc=True).limit(limit).execute()

            rows = list(reversed(result.data))

            history = []

            for row in rows:
                history.append({
                    "content": row["message"],
                    "role": row["role"],
                })
            
            return history
        
        except Exception as error:
            print(f"Error Ngambil History: {error}")
            return []