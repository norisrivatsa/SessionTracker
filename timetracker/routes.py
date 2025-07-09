from fastapi import APIRouter, HTTPException, Request, Query
from fastapi.responses import JSONResponse
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from datetime import datetime, timedelta, date
from mongo import COURSES_COLLECTION , SESSIONS_COLLECTION
from courses import Course, CourseUpdate, update_course, delete_course, CourseSession, create_course_in_db_from_request, modify_course
from typing import List, Optional


router = APIRouter()

templates = Jinja2Templates(directory="templates")

# Root endpoint: serve home.html
@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})

@router.get('/home', response_class=HTMLResponse)
async def home_page(request: Request):
    return templates.TemplateResponse("home.html", {"request": request})    

@router.get('/courses', response_class=HTMLResponse)
async def list_courses(request: Request):
    return templates.TemplateResponse("courses.html", {"request": request})


@router.get('/record_session', response_class=HTMLResponse)
async def recorded_sessions(request: Request):
    return templates.TemplateResponse("record_session.html", {"request": request})

@router.get('/all_sessions', response_class=HTMLResponse)
async def all_sessions_page(request: Request):
    return templates.TemplateResponse("all_sessions.html", {"request": request})

@router.get('/analytics', response_class=HTMLResponse)
async def analytics_page(request: Request):
    return templates.TemplateResponse("analytics.html", {"request": request})

@router.get('/api/courses/active')
async def get_active_courses():
    try:
        courses = []
        for course_data in COURSES_COLLECTION.find({'completed': False}):
            course = {
                "name": course_data.get("name", ""),
                "course_id": str(course_data.get("course_id")),
                "started_on": course_data.get("started_on").isoformat() if course_data.get("started_on") else None,
                "total_sessions": course_data.get("total_sessions", 0),
                "total_time_spent": course_data.get("total_time_spent", 0),  # assumed to be in minutes
                "course_type": course_data.get("course_type", "Course"),
                "weekly_target": course_data.get("weekly_target", 0),
            }
            courses.append(course)
        return JSONResponse(content={'courses': courses})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/api/courses/create')
async def create_course(request: Request):
    try:
        created_course = await create_course_in_db_from_request(request)
        if created_course is None:
            raise HTTPException(status_code=500, detail="Course creation failed.")
        return JSONResponse(
            content={"message": f"Course created with course_id = {created_course.course_id}"},
            status_code=200
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/api/courses/modify')
async def modify_course_endpoint(course: CourseUpdate, course_id: str = Query(...)):
    try:
        updated = await modify_course(course_id, course)
        if not updated:
            raise HTTPException(status_code=404, detail="Course not found or not updated.")
        return JSONResponse(status_code=200, content={"message": "Course updated successfully", "course_id": course_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/api/courses/delete')
async def remove_course(course_id: str = Query(...)):
    try:
        # Delete all sessions for this course
        SESSIONS_COLLECTION.delete_many({"course_id": str(course_id)})
        # Delete the course itself
        deleted = await delete_course(course_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Course not found or not deleted.")
        return JSONResponse(content={"success": True})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import uuid

def generate_session_id(course_id: str) -> str:
    prefix = course_id[:2].upper()  # First 2 characters, uppercase for consistency
    unique_part = uuid.uuid4().hex[:10]  # 10 hex digits from UUID
    return f"{prefix}{unique_part}"

import traceback

def update_course_with_session(course_id: str, session: dict):
    # Add session to the course's sessions array and update total_time_spent
    course = COURSES_COLLECTION.find_one({"course_id": str(course_id)})
    if not course:
        return
    # Ensure sessions list exists
    sessions = course.get("sessions", [])
    sessions.append(session)
    # Calculate new total_time_spent
    total_time_spent = sum(s.get("time_spent", 0) for s in sessions)
    COURSES_COLLECTION.update_one(
        {"course_id": str(course_id)},
        {
            "$set": {"sessions": sessions, "total_time_spent": total_time_spent}
        }
    )

@router.post('/api/session/add')
async def add_session(request: Request):
    try:
        session_data = await request.json()
        print("Received session data:", session_data)

        if 'course_id' not in session_data:
            raise ValueError("Missing course_id in request")

        session_data['session_id'] = generate_session_id(session_data['course_id'])
        session = CourseSession(**session_data)  # Will validate required fields

        session_dict = session.dict()
        # Convert date to ISO string for MongoDB
        if 'date' in session_dict and hasattr(session_dict['date'], 'isoformat'):
            session_dict['date'] = session_dict['date'].isoformat()

        result = SESSIONS_COLLECTION.insert_one(session_dict)

        # --- Add session to course and update total_time_spent ---
        update_course_with_session(session_data['course_id'], {
            "session_id": session_dict["session_id"],
            "session_name": session_dict["session_name"],
            "session_description": session_dict.get("session_description"),
            "date": session_dict["date"],
            "started_at": session_dict.get("started_at"),
            "ended_at": session_dict.get("ended_at"),
            "time_spent": session_dict["time_spent"],
            "topics": session_dict.get("topics", [])
        })

        return JSONResponse(content={"success": True, "session_id": session.session_id})
    except Exception as e:
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))




@router.get('/api/sessions/by_course')
async def get_sessions_by_course(course_id: str):
    try:
        sessions = list(SESSIONS_COLLECTION.find({"course_id": str(course_id)}))
        # Sort by date descending, then started_at
        sessions.sort(key=lambda s: (s.get('date', ''), s.get('started_at', '')), reverse=True)
        # Only include relevant fields
        result = []
        for s in sessions:
            result.append({
                "session_id": s.get("session_id", ""),
                "session_name": s.get("session_name", ""),
                "session_description": s.get("session_description", ""),
                "date": s.get("date", ""),
                "started_at": s.get("started_at", ""),
                "ended_at": s.get("ended_at", ""),
                "time_spent": s.get("time_spent", 0),
                "session_topics": s.get("topics", []),
            })
        return JSONResponse(content={"sessions": result})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/api/session/delete')
async def delete_session(session_id: str = Query(...)):
    try:
        result = SESSIONS_COLLECTION.delete_one({"session_id": session_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found or not deleted.")
        return JSONResponse(content={"success": True})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def fetch_sessions_by_view(view: str):
    now = datetime.now()
    if view == 'week':
        start_date = (now - timedelta(days=now.weekday())).date()
        end_date = start_date + timedelta(days=6)
    else:
        start_date = now.replace(day=1).date()
        days = (now.replace(month=now.month % 12 + 1, day=1) - timedelta(days=1)).day
        end_date = now.replace(day=days).date()

    sessions = list(SESSIONS_COLLECTION.find({}))
    filtered_sessions = []
    for s in sessions:
        date_str = s.get('date')
        if not date_str:
            continue
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
        except Exception:
            continue
        if start_date <= date_obj <= end_date:
            s['date_obj'] = date_obj
            if 'course_id' in s:
                s['course_id'] = str(s['course_id'])
            filtered_sessions.append(s)
    return filtered_sessions, start_date, end_date, days if view == 'month' else 7


@router.get('/api/analytics')
async def get_analytics(
    view: str = Query('week', enum=['week', 'month']),
    course: str = Query('all')
):
    try:
        sessions, start_date, end_date, days = await fetch_sessions_by_view(view)

        # Filter sessions by course if needed
        if course != 'all':
            sessions = [s for s in sessions if str(s.get('course_id')) == str(course)]

        courses = list(COURSES_COLLECTION.find({}))
        course_map = {str(c['course_id']): c for c in courses}

        live_courses = []
        for c in courses:
            if c.get('completed', False):
                continue
            course_id = str(c['course_id'])
            name = c.get('name', '')
            weekly_target = c.get('weekly_target', 0)
            monthly_target = c.get('monthly_target', 0)
            course_sessions = [s for s in sessions if str(s.get('course_id')) == course_id]
            time_spent = sum(s.get('time_spent', 0) for s in course_sessions)
            target = weekly_target if view == 'week' else monthly_target
            live_courses.append({
                'name': name,
                'weeklyTarget': weekly_target,
                'monthlyTarget': monthly_target,
                'timeSpent': time_spent,
                'target': target
            })

        completed_courses = []
        for c in courses:
            if not c.get('completed', False):
                continue
            course_id = str(c['course_id'])
            name = c.get('name', '')
            course_sessions = [s for s in sessions if str(s.get('course_id')) == course_id]
            total_time = sum(s.get('time_spent', 0) for s in course_sessions)
            completed_courses.append({
                'name': name,
                'totalTime': total_time,
                'sessions': len(course_sessions)
            })

        monthly_total = sum(
            s.get('time_spent', 0)
            for s in sessions
            if s.get('date_obj') and s['date_obj'].month == datetime.now().month and s['date_obj'].year == datetime.now().year
        )

        max_session = {'duration': 0, 'course': ''}
        for s in sessions:
            duration = s.get('time_spent', 0)
            if duration > max_session['duration']:
                max_session['duration'] = duration
                course_id = s.get('course_id')
                max_session['course'] = course_map.get(str(course_id), {}).get('name', '')

        # Bar graph data: always just total time per day
        if view == 'week':
            labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
            data = [0]*7
            for s in sessions:
                date_obj = s.get('date_obj')
                duration = s.get('time_spent', 0)
                if date_obj and start_date <= date_obj <= end_date:
                    idx = date_obj.weekday()
                    data[idx] += duration
        else:
            labels = [f"{i+1:02d}" for i in range(days)]
            # labels = [f"Day {i+1}" for i in range(days)]
            data = [0]*days
            for s in sessions:
                date_obj = s.get('date_obj')
                duration = s.get('time_spent', 0)
                if date_obj and date_obj.month == datetime.now().month and date_obj.year == datetime.now().year:
                    idx = date_obj.day - 1
                    data[idx] += duration

        # No perCourseGraph for "all"
        per_course_graph = None

        return JSONResponse(content={
            'liveCourses': live_courses,
            'completedCourses': completed_courses,
            'monthlyTotal': monthly_total,
            'maxSession': max_session,
            'graph': {
                'labels': labels,
                'data': data
            },
            'perCourseGraph': per_course_graph,
            'allSessions': [
                {
                    'course_id': s.get('course_id'),
                    'date': s.get('date'),
                    'time_spent': s.get('time_spent', 0)
                }
                for s in sessions
            ]
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/api/sessions/week')
async def get_sessions_week():
    try:
        now = datetime.now()
        start_date = (now - timedelta(days=now.weekday())).date()
        end_date = start_date + timedelta(days=6)

        sessions = list(SESSIONS_COLLECTION.find({}))
        result = []

        for s in sessions:
            date_str = s.get('date')
            print(f"Processing session date: {date_str}")
            if not date_str:
                continue

            try:
                if isinstance(date_str, datetime):
                    date_obj = date_str.date()
                elif isinstance(date_str, str):
                    if 'T' in date_str:
                        date_obj = datetime.fromisoformat(date_str).date()
                    else:
                        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
                elif isinstance(date_str, date):
                    date_obj = date_str
                else:
                    print(f"Unknown date format: {date_str}")
                    continue
            except Exception as e:
                print(f"Date parsing failed for {date_str}: {e}")
                continue

            if start_date <= date_obj <= end_date:
                course_id = s.get('course_id')
                try:
                    course = COURSES_COLLECTION.find_one({"course_id": course_id})
                    s['course_name'] = course.get('name', '') if course else ''
                except Exception as e:
                    print(f"Course lookup failed for {course_id}: {e}")
                    s['course_name'] = ''
                
                if '_id' in s:
                    del s['_id']  # 💡 REMOVE ObjectId before sending
                
                result.append(s)

        return JSONResponse(content={'sessions': result})

    except Exception as e:
        print("Unhandled error occurred:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")

@router.get('/api/next_session_name')
async def get_next_session_name(course_id: str = Query(...)):
    try:
        course = COURSES_COLLECTION.find_one({"course_id": str(course_id)})
        if not course:
            return JSONResponse(content={"next_session_name": ""})
        sessions = course.get("sessions", [])
        next_number = len(sessions) + 1
        # Optionally, you can use course_type in the name if needed
        course_type = course.get("course_type", "Session")
        # Capitalize first letter
        course_type_cap = course_type.capitalize()
        next_name = f"{course_type_cap} {next_number}"
        return JSONResponse(content={"next_session_name": next_name})
    except Exception as e:
        return JSONResponse(content={"next_session_name": ""})

