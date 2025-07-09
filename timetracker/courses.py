from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel
from mongo import COURSES_COLLECTION, SESSIONS_COLLECTION
from enum import Enum

class CourseSession(BaseModel):
    session_id: str
    course_id: str
    session_name: str
    session_description: Optional[str] = None
    date: date  # Required date field (YYYY-MM-DD)
    started_at: Optional[str] = None  # Time only, e.g., "14:30"
    ended_at: Optional[str] = None    # Time only, e.g., "16:00"
    time_spent: int  # in minutes
    topics: List[str] = []

class CourseType(str, Enum):
    COURSE = "Course"
    PROJECT = "Project"

class Course(BaseModel):
    course_id: str  
    name: str
    description: Optional[str] = None
    completed: bool = False
    started_on: Optional[datetime] = None
    completed_on: Optional[datetime] = None
    sessions: List[CourseSession] = []
    total_time_spent: int = 0  # in minutes
    total_sessions: int = 0
    course_type: CourseType = CourseType.COURSE
    weekly_target: Optional[int] = None  # in minutes


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    started_on: Optional[datetime] = None
    completed_on: Optional[datetime] = None
    sessions: Optional[List[CourseSession]] = None
    total_time_spent: Optional[int] = None
    total_sessions: Optional[int] = None
    course_type: Optional[CourseType] = None
    weekly_target: Optional[int] = None



async def create_course_in_db(course: Course) -> Course:
    try:
        course_dict = course.dict()
        course_count = COURSES_COLLECTION.count_documents({})
        course_dict["course_id"] = str(course_count + 1)  # Simple ID generation
        course_dict["started_on"] = datetime.now() if not course_dict.get("started_on") else course_dict["started_on"]
        course_dict["completed_on"] = None  # Set to None initially
        course_dict["sessions"] = []  # Initialize with an empty list
        course_dict["total_time_spent"] = 0  # Initialize total time spent
        course_dict["total_sessions"] = 0  # Initialize total sessions
        course_dict["completed"] = False  # Default to not completed
        course_dict["created_at"] = datetime.now()  # Add created_at field
        if not course_dict.get("course_type"):
            course_dict["course_type"] = CourseType.COURSE
        result = COURSES_COLLECTION.insert_one(course_dict)
        course.course_id = str(result.course_id)
        return course
    except Exception as e:
        print(f"Error in create_course: {e}")
        return None

async def get_course(course_id: str) -> Optional[Course]:
    try:
        course_data =  COURSES_COLLECTION.find_one({"course_id": course_id})
        if course_data:
            return Course(**course_data)
        return None
    except Exception as e:
        print(f"Error in get_course: {e}")
        return None

async def update_course(course_id: str, course: CourseUpdate) -> Optional[Course]:
    try:
        course_data = course.dict()
        result = COURSES_COLLECTION.update_one(
            {"course_id": course_id},
            {"$set": course_data}
        )
        if result.modified_count > 0:
            return await get_course(course_id)
        return None
    except Exception as e:
        print(f"Error in update_course: {e}")
        return None

async def modify_course(course_id: str, course: CourseUpdate) -> bool:
    try:
        course_data = course.dict(exclude_unset=True)
        result = COURSES_COLLECTION.update_one(
            {"course_id": course_id},
            {"$set": course_data}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error in update_course: {e}")
        return False


async def delete_course(course_id: str) -> bool:
    try:
        result = COURSES_COLLECTION.delete_one({"course_id": course_id})
        return result.deleted_count > 0
    except Exception as e:
        print(f"Error in delete_course: {e}")
        return False

async def list_courses() -> List[Course]:
    try:
        courses = []
        async for course_data in COURSES_COLLECTION.find():
            courses.append(Course(**course_data))
        return courses
    except Exception as e:
        print(f"Error in list_courses: {e}")
        return []

async def add_session_to_course(course_id: str,  session: CourseSession) -> Optional[Course]:
    try:
        course = await get_course(course_id)
        if not course:
            return None
        session.session_id = await create_session_id(course_id)  # Assign a new session ID
        session.started_at = None
        session.ended_at = None
        session.time_spent = session.ended_at.minute - session.started_at.minute if session.ended_at and session.started_at else 0
        course.sessions.append(session)
        course.total_time_spent += session.time_spent
        course.total_sessions += 1
        updated_course = await update_course(course_id, course)
        return updated_course
    except Exception as e:
        print(f"Error in add_session_to_course: {e}")
        return None

async def remove_session_from_course(course_id: str, session_id: int) -> Optional[Course]:
    try:
        course = await get_course(course_id)
        if not course:
            return None
        session_to_remove = next((s for s in course.sessions if s.session_id == session_id), None)
        if not session_to_remove:
            return None
        course.sessions.remove(session_to_remove)
        course.total_time_spent -= session_to_remove.time_spent
        course.total_sessions -= 1
        updated_course = await update_course(course_id, course)
        return updated_course
    except Exception as e:
        print(f"Error in remove_session_from_course: {e}")
        return None

async def complete_course(course_id: str) -> Optional[Course]:
    try:
        course = await get_course(course_id)
        if not course:
            return None
        course.completed = True
        course.completed_on = datetime.now()
        updated_course = await update_course(course_id, course)
        return updated_course
    except Exception as e:
        print(f"Error in complete_course: {e}")
        return None

async def create_session_id(course_id: str) -> str:
    try:
        course = await get_course(course_id)
        if not course:
            return f"No Course with Course ID = {course_id}"  # Default session ID if course not found
        session_count = len(course.sessions)
        session_id = f"{course_id}" + f"{session_count + 1:05d}"
        return session_id
    except Exception as e:
        print(f"Error in create_session_id: {e}")
        return "00000"

def generate_new_course_id():
    # Find all course_ids, extract last 3 digits, increment, and pad to 3 digits
    courses = list(COURSES_COLLECTION.find({}, {"course_id": 1}))
    max_id = 0
    for c in courses:
        cid = str(c.get("course_id", ""))
        if len(cid) >= 3 and cid[-3:].isdigit():
            num = int(cid[-3:])
            if num > max_id:
                max_id = num
    new_id_num = max_id + 1
    return f"{new_id_num:03d}"

async def create_course_in_db_from_request(request):
    try:
        data = await request.json()
        # Generate course_id first
        course_id = generate_new_course_id()
        data["course_id"] = course_id
        # Validate and create Course object
        course = Course(**data)
        course_dict = course.dict()
        # Set defaults for missing fields
        course_dict["started_on"] = datetime.now() if not course_dict.get("started_on") else course_dict["started_on"]
        course_dict["completed_on"] = None
        course_dict["sessions"] = []
        course_dict["total_time_spent"] = 0
        course_dict["total_sessions"] = 0
        course_dict["completed"] = False
        course_dict["created_at"] = datetime.now()
        if not course_dict.get("course_type"):
            course_dict["course_type"] = CourseType.COURSE
        COURSES_COLLECTION.insert_one(course_dict)
        return Course(**course_dict)
    except Exception as e:
        print(f"Error in create_course_in_db_from_request: {e}")
        return None