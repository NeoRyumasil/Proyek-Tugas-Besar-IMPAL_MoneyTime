from Controller.databaseController import db_connect

class User():
    def __init__(self, user_id = None, username = None, email_address = None, password = None, role = 'user'):
        self.user_id = user_id
        self.username = username
        self.password = password
        self.email_address = email_address
        self.role = role

    def get_user_id(self):
        return self.user_id
    
    # Cari email atau username
    @staticmethod
    def find_email_or_username(identifier):
        conn = db_connect()

        try :
            result = conn.table("User").select("id, username, email, password, role").eq("email", identifier).execute()
            row = result.data

            if not row:
                result = conn.table("User").select("id, username, email, password, role").eq("username", identifier).execute()
                row = result.data
            
            if row:
                user = row[0]
                return User(user_id=user['id'], username=user['username'], email_address=user['email'], password=user['password'], role=user['role'])
        
        except Exception as error:
            print(f"Error mendapatkan user: {error}")
    
    # Cari apakah username dan email sudah ada
    @staticmethod
    def check_user_email_exist(username, email):
        conn = db_connect()
        
        try:
            username_result = conn.table("User").select("id").eq("username", username).execute()
            email_result = conn.table("User").select("id").eq("email", email).execute()
            return len(username_result.data) > 0 or len(email_result.data > 0)
        
        except Exception as error:
            print(f"Error cek user: {error}")
            return False

    # Membuat User
    @staticmethod
    def create_user(username, hashed_password, email):
        conn = db_connect()
        
        try:
            conn.table("User").insert({
                "username": username,
                "password": hashed_password,
                "email": email,
                "role": "user"
            }).execute()

            return True
        
        except Exception as error:
            print(f"Error membuat user: {error}")
            return False
    
    # Update Password User
    @staticmethod
    def update_password(email, hashed_password):
        conn = db_connect()
        
        try:
            conn.table("User").update({
                "password": hashed_password
            }).eq("email", email).execute()

            return True
        
        except Exception as error:
            print(f"Error update password: {error}")
            return False
