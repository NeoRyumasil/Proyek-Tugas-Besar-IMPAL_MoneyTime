from Controller.databaseController import db_connect

class User ():
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
        cursor = conn.cursor()

        try :
            sql = """
                SELECT id, username, email, password, role
                FROM [dbo].[user]
                WHERE email = %s OR username = %s
            """
            cursor.execute(sql, (identifier, identifier))
            row = cursor.fetchone()

            if row:
                return User(user_id=row[0], username=row[1], email_address=row[2], password=row[3], role=row[4])
            return None
        
        finally:
            conn.close()
    
    # Cari apakah username dan email sudah ada
    @staticmethod
    def check_user_email_exist(username, email):
        conn = db_connect()
        cursor = conn.cursor()

        try:
            sql = """
                SELECT COUNT(*) FROM [dbo].[User]
                WHERE username = %s OR email = %s
            """
            cursor.execute(sql, (username, email))
            count = cursor.fetchone()[0]
            return count > 0
        
        finally:
            conn.close()
    
    # Membuat User
    @staticmethod
    def create_user(username, hashed_password, email):
        conn = db_connect
        cursor = conn.cursor()

        try:
            sql = """
                INSERT INTO [dbo].[User] (username, password, email, role)
                VALUES (%s, %s, %s, 'user')
            """
            cursor.execute(sql, (username, hashed_password, email))
            conn.commit()
            return True
        
        except Exception as error:
            print(f"Error membuat user: {error}")
            return False
        
        finally:
            conn.close()
    
    # Update Password User
    @staticmethod
    def update_password(email, hashed_password):
        conn = db_connect()
        cursor = conn.cursor()

        try:
            sql = """
                UPDATE [dbo].[User]
                SET password = %s WHERE email = %s
            """
            cursor.execute(sql, (hashed_password, email))
            conn.commit()
            return True
        
        except Exception as error:
            print(f"Error Update Password: {error}")
            return False
        
        finally:
            conn.close()
