import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
# Read the value of the MONGO_URI variable
mongo_uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME")

client = MongoClient(mongo_uri)
db = client[db_name]

# Collection constants
COURSES_COLLECTION = db["courses"]
SESSIONS_COLLECTION = db["sessions"]
