from Controller.databaseController import db_connect
from typing import List, Dict, Any

class Assistant():
    
    # Buat Nyimpan Chat Log
    def create_log(self, user_id : str, content : str, role : str) -> bool:
        
        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                INSERT INTO Chatlog (userid, message, role, timestamp)
                VALUES (%s, %s, %s, NOW())
            """
            cursor.execute(sql, (user_id, content, role))
            conn.commit()
            return True
    
        except Exception as error:
            print(f"Error membuat log: {error}")

        finally:
            conn.close()
    
    # Cek History untuk AI
    def get_chat_history(self, user_id : str, limit : int = 50) -> List[Dict[str, Any]]:

        try:
            conn = db_connect()
            cursor = conn.cursor()
            sql = """
                SELECT message, role, timestamp
                FROM (
                    SELECT message, role, timestamp
                    FROM Chatlog
                    WHERE userid = %s
                    ORDER BY timestamp DESC
                    LIMIT 50
                ) AS subquery
                ORDER BY timestamp ASC
            """
            cursor.execute(sql, (user_id))
            rows = cursor.fetchall()

            history = []
            for row in rows:
                history.append({
                    "message": row[0],
                    "role" : row[1],
                    "timestamp" : str(row[2])
                })
            
            return history
        
        except Exception as error:
            print(f"Error Ngambil History : {error}")
            return []
        
        finally:
            conn.close()