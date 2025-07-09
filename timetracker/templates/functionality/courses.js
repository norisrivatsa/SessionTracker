// courses.js - Handles fetching, rendering, and creating courses

document.addEventListener('DOMContentLoaded', function() {
    fetchAndRenderCourses();

    // Modal logic
    const modal = document.getElementById('createCourseModal');
    const openBtn = document.getElementById('openCreateCourseModal');
    const closeBtn = document.getElementById('closeCreateCourseModal');
    openBtn.addEventListener('click', () => { modal.style.display = 'block'; });
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.onclick = function(event) {
        if (event.target == modal) modal.style.display = 'none';
    };

    // Create course form submit
    const createForm = document.getElementById('createCourseForm');
    createForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        let weeklyTargetVal = createForm.weekly_target.value;
        let weeklyTargetMinutes = null;
        if (weeklyTargetVal !== "" && !isNaN(weeklyTargetVal)) {
            weeklyTargetMinutes = Math.round(Number(weeklyTargetVal) * 60);
        }
        const data = {
            name: createForm.name.value.trim(),
            description: createForm.description.value.trim(),
            course_type: createForm.course_type.value,
            completed: false,
            started_on: createForm.started_on.value || undefined,
            completed_on: null,
            // Convert weekly_target from hours to minutes
            weekly_target: weeklyTargetMinutes
        };
        try {
            const resp = await fetch('/api/courses/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (resp.ok) {
                modal.style.display = 'none';
                showNotification('success', 'Course created successfully!');
                createForm.reset();
                fetchAndRenderCourses();
            } else {
                const err = await resp.json();
                showNotification('fail', 'Failed to create course: ' + (err.detail || resp.statusText));
            }
        } catch (err) {
            showNotification('fail', 'Error: ' + err.message);
        }
    });
});


// Notification system: showNotification(type, message, duration)

async function fetchAndRenderCourses() {
     const list = document.getElementById('coursesList');

    let courses = [];
    try {
        const resp = await fetch('/api/courses/active');
        if (resp.ok) {
            const data = await resp.json();
            courses = data.courses || [];
        }
    } catch (e) {
        list.innerHTML = '<div>Error loading courses.</div>';
        return;
    }

    if (courses.length === 0) {
        list.innerHTML = '<div>No active courses.</div>';
        return;
    }

    list.innerHTML = courses.map((course, idx) => `
        <div class="course-card" >
            <div class="course-card-info">
                    <div class="course-meta-title">
                        <span class="course-title" style="font-size:1.5rem;font-weight:bold;">${course.name}</span>
                        <span class="course-meta" style="font-size:1rem"><b>${course.course_type || 'Course'}</b></span>
                        <span class="course-meta" style="font-size:1rem;color:#4caf50;">
                            Weekly Target: ${course.weekly_target ? Math.floor(course.weekly_target / 60) + 'h ' + (course.weekly_target % 60) + 'm' : '<i>Not set</i>'}
                        </span>
                    </div>
                    <div class="course-meta-sessions">
                        <span>Sessions </span>
                        <span class="course-meta" style="font-size:1.2rem;">${course.total_sessions || 0}</span>
                    </div>
                    <div class="course-meta-time">
                        <span>Total Time</span>
                        <span class="course-meta" style="font-size:1.2rem;">${Math.floor((course.total_time_spent || 0) / 60)}h ${(course.total_time_spent || 0) % 60}m</span>
                    </div>    
                <button class="expand-btn" data-idx="${idx}" style="background:none;border:none;font-size:1.6rem;cursor:pointer;">&#9660;</button>
            </div>
            <div class="course-details" id="course-details-${idx}" style="display:none;">
                <div><b>Description:</b> ${course.description || '<i>No description</i>'}</div>
                <div><b>Started On:</b> ${course.started_on ? new Date(course.started_on).toLocaleString() : '<i>Not started</i>'}</div>
                <div><b>Course ID:</b> ${course.course_id || ''}</div>
            </div>
        </div>
    `).join('');

        list.querySelectorAll('.expand-btn').forEach(btn => {
        const list = document.getElementById('coursesList');
        btn.onclick = function () {
            const idx = btn.getAttribute('data-idx');
            const details = document.getElementById('course-details-' + idx);
            const isHidden = details.style.display === 'none' || details.style.display === '';
            details.style.display = isHidden ? 'block' : 'none';
            btn.innerHTML = isHidden ? '&#9650;' : '&#9660;';
        };
    });
    }


// type: 'success' | 'fail', message: string, duration: ms (optional, default 3000)
function showNotification(type, message, duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    container.style.display = 'block';
    // Create notification element
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `
        <span>${message}</span>
        <button class="close-btn" aria-label="Close notification">&times;</button>
    `;
    // Close button logic
    notif.querySelector('.close-btn').onclick = function(e) {
        e.stopPropagation();
        notif.style.animation = 'notification-out 0.3s forwards';
        setTimeout(() => notif.remove(), 300);
    };
    // Auto-remove after duration
    setTimeout(() => {
        if (notif.parentNode) {
            notif.style.animation = 'notification-out 0.3s forwards';
            setTimeout(() => notif.remove(), 300);
        }
    }, duration);
    // Remove container if empty
    notif.addEventListener('animationend', () => {
        if (!container.hasChildNodes()) container.style.display = 'none';
    });
    container.appendChild(notif);
}

// --- Modify & Delete Course Modal Logic ---

// Store courses globally for selects
let allCourses = [];

// Fetch all courses for selects (reuse fetchAndRenderCourses logic)
async function fetchAllCoursesForSelects() {
    try {
        const resp = await fetch('/api/courses/active');
        if (resp.ok) {
            const data = await resp.json();
            allCourses = data.courses || [];
        }
    } catch (e) {
        allCourses = [];
    }
}

// Populate modify course select and autofill fields
window.populateModifyCourseSelect = async function() {
    await fetchAllCoursesForSelects();
    const select = document.getElementById('modify_course_select');
    select.innerHTML = allCourses.map(c => `<option value="${c.course_id}">${c.name}</option>`).join('');
    if (allCourses.length > 0) {
        fillModifyFields(allCourses[0]);
    }
    select.onchange = function() {
        const course = allCourses.find(c => c.course_id === select.value);
        if (course) fillModifyFields(course);
    };
};
function fillModifyFields(course) {
    document.getElementById('modify_name').value = course.name;
    document.getElementById('modify_description').value = course.description || '';
    document.getElementById('modify_started_on').value = course.started_on ? new Date(course.started_on).toISOString().slice(0,16) : '';
    document.getElementById('modify_course_type').value = course.course_type || 'Course';
    // Convert from minutes to hours for display
    document.getElementById('modify_weekly_target').value = course.weekly_target != null ? (course.weekly_target / 60) : '';
}

// Populate delete course select
window.populateDeleteCourseSelect = async function() {
    await fetchAllCoursesForSelects();
    const select = document.getElementById('delete_course_select');
    select.innerHTML = allCourses.map(c => `<option value="${c.course_id}">${c.name}</option>`).join('');
};

// --- Modify Course Form Submission ---
// --- Modify Course Form Submission ---
document.getElementById('modifyCourseForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Get selected course ID
    const id = document.getElementById('modify_course_select').value;
    if (!id) {
    showNotification('fail', 'No course selected!');
    return;
    }
    console.log('Modifying course ID:', id);

    // Convert weekly target (hours) to minutes
    let weeklyTargetVal = document.getElementById('modify_weekly_target').value;
    let weeklyTargetMinutes = null;
    if (weeklyTargetVal !== "" && !isNaN(weeklyTargetVal)) {
        weeklyTargetMinutes = Math.round(Number(weeklyTargetVal) * 60);
    }

    // Build data object
    const data = {
        name: document.getElementById('modify_name').value.trim(),
        description: document.getElementById('modify_description').value.trim(),
        course_type: document.getElementById('modify_course_type').value,
        started_on: document.getElementById('modify_started_on').value || undefined,
        weekly_target: weeklyTargetMinutes
    };

    try {
        // Send PUT request with course_id as query param
        const resp = await fetch(`/api/courses/modify?course_id=${encodeURIComponent(id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (resp.ok) {
            showNotification('success', 'Course modified successfully!');
            document.getElementById('modifyCourseModal').style.display = 'none';
            fetchAndRenderCourses();
        } else {
            const err = await resp.json();
            showNotification('fail', 'Failed to modify course: ' + (err.detail || resp.statusText));
        }
    } catch (err) {
        showNotification('fail', 'Error: ' + err.message);
    }
});

// --- Delete Course Form Submission ---
document.getElementById('deleteCourseForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const selectElement = document.getElementById('delete_course_select');
    if (!selectElement) {
        console.error('Select element not found!');
        return;
    }

    const id = selectElement.value;
    console.log('Selected course ID:', id);

    if (!id) {
        showNotification('fail', 'No course selected');
        return;
    }

    try {
        const resp = await fetch(`/api/courses/delete?course_id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
        if (resp.ok) {
            showNotification('success', 'Course deleted successfully!');
            document.getElementById('deleteCourseModal').style.display = 'none';
            fetchAndRenderCourses();
        } else {
            const err = await resp.json();
            showNotification('fail', 'Failed to delete course: ' + (err.detail || resp.statusText));
        }
    } catch (err) {
        showNotification('fail', 'Error: ' + err.message);
    }
});

