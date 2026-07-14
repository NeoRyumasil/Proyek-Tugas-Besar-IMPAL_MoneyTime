import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("SUPABASE_URL")

# Set Engine
engine = create_engine(DATABASE_URL, echo=False)
session = sessionmaker(bind=engine)
base = declarative_base()

# Get Database Connection
def get_db():
    db = session()

    try :
        yield db
    
    finally:
        db.close