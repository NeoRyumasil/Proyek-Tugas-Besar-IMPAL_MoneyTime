from Controller.databaseController import db_connect

try:
    conn = db_connect()
    cursor = conn.cursor()
    # Test connection
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    print("Database connection successful:", result)

    # Check if table exists
    cursor.execute("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'User'")
    table_exists = cursor.fetchone()
    if table_exists:
        print("Table [dbo].[User] exists.")
        # Check if there are any users
        cursor.execute("SELECT COUNT(*) FROM [dbo].[User]")
        user_count = cursor.fetchone()[0]
        print(f"Number of users in table: {user_count}")
    else:
        print("Table [dbo].[User] does not exist.")

    conn.close()
except Exception as e:
    print("Database connection or query failed:", e)
