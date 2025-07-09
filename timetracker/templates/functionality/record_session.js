// Handles Add Session and Record Session form submissions for record_session.html

document.addEventListener('DOMContentLoaded', function() {
    // --- Populate course selects ---
    async function populateCourseSelects() {
        try {
            const resp = await fetch('/api/courses/active');
            let options = '<option value="">Select a course</option>';
            if (resp.ok) {
                const data = await resp.json();
                const courses = data.courses || [];
                options += courses.map(c => `<option value="${c.course_id}">${c.name}</option>`).join('');
            } else {
                options += '<option value="">Error loading courses</option>';
            }
            document.getElementById('course_id').innerHTML = options;
            document.getElementById('course_id_timer').innerHTML = options;
        } catch (e) {
            const errOpt = '<option value="">Error loading courses</option>';
            document.getElementById('course_id').innerHTML = errOpt;
            document.getElementById('course_id_timer').innerHTML = errOpt;
        }
    }
    populateCourseSelects();

    // Add Session form
    const addSessionForm = document.getElementById('addSessionForm');
    const addSessionClearBtn = addSessionForm.parentElement.querySelector('.clear-btn');
    const addSessionSubmitBtn = addSessionForm.parentElement.querySelector('.add-btn');

    addSessionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Validate required fields
        const session_name = addSessionForm.session_name.value.trim();
        const session_description = addSessionForm.session_description.value.trim();
        const course_id = addSessionForm.course_id.options[addSessionForm.course_id.selectedIndex].value;
        const topics = (addSessionForm.topics.value || "").split(',').map(t => t.trim()).filter(Boolean);
        const date = addSessionForm.date.value;
        const started_at = addSessionForm.started_at.value; // "HH:MM"
        const ended_at = addSessionForm.ended_at.value;     // "HH:MM"

        // Calculate time_spent in minutes
        function getMinutes(t) {
            if (!t) return 0;
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        }
        const time_spent = getMinutes(ended_at) - getMinutes(started_at);

        if (!session_name || !course_id || !date || !started_at || !ended_at || time_spent <= 0) {
            showNotification('fail', 'Please fill all required fields and ensure end time is after start time.');
            return;
        }

        const data = {
            session_name: session_name,
            session_description: session_description || undefined,
            course_id,
            date,
            started_at,
            ended_at,
            time_spent,
            topics
        };

        
        try {
            const resp = await fetch('/api/session/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (resp.ok) {
                showNotification('success', 'Session added successfully!');
                addSessionForm.reset();
            } else {
                const err = await resp.json();
                showNotification('fail', 'Failed to add session: ' + (err.detail || resp.statusText));
            }
        } catch (err) {
            showNotification('fail', 'Error adding session: ' + err);
        }
    });


    addSessionClearBtn.addEventListener('click', function (e) {
    e.preventDefault();
    addSessionForm.reset();
    });
    // Remove this block (duplicate submit trigger)
    document.querySelector('.add-btn').addEventListener('click', function () {
        document.getElementById('addSessionForm').requestSubmit();  // Trigger form submit
    });

    // Record Session form
    const recordSessionForm = document.getElementById('recordSessionForm');
    const recordSessionClearBtn = recordSessionForm.parentElement.querySelector('.clear-btn');
    const recordSessionSubmitBtn = document.getElementById('recordSessionBtn');

    recordSessionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Validate required fields
        const session_name = recordSessionForm.session_name_timer.value.trim();
        const session_description = recordSessionForm.session_description_timer.value.trim();
        const course_id = recordSessionForm.course_id_timer.value.trim();
        const topics = recordSessionForm.topics_timer.value.split(',').map(t => t.trim()).filter(Boolean);
        const started_at = recordSessionForm.started_at_timer.value; // "HH:MM:SS" or ISO, extract time part
        const ended_at = recordSessionForm.ended_at_timer.value;
        const time_spent = recordSessionForm.time_spent_timer.value ? Number(recordSessionForm.time_spent_timer.value) : null;
        const date = recordSessionForm.date_timer.value;

        // Extract "HH:MM" from ISO string if needed
        function extractTime(val) {
            if (!val) return "";
            if (val.length === 5) return val; // already "HH:MM"
            try {
                return new Date(val).toTimeString().slice(0,5);
            } catch {
                return val;
            }
        }

        const started_at_time = extractTime(started_at);
        const ended_at_time = extractTime(ended_at);

        if (!session_name || !course_id || !started_at_time || !ended_at_time || time_spent === null || !date) {
            showNotification('fail', 'Please fill all required fields.');
            return;
        }

        const data = {
            session_name,
            session_description: session_description || undefined,
            course_id,
            date,
            started_at: started_at_time,
            ended_at: ended_at_time,
            time_spent: time_spent,
            topics
        };

        try {
            const resp = await fetch('/api/session/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (resp.ok) {
                showNotification('success', 'Session recorded successfully!');
                recordSessionForm.reset();
                // Optionally reset timer display
                const timerDisplay = document.getElementById('timerDisplay');
                if (timerDisplay) timerDisplay.textContent = '00:00:00';
            } else {
                const err = await resp.json();
                showNotification('fail', 'Failed to record session: ' + (err.detail || resp.statusText));
            }
        } catch (err) {
            showNotification('fail', 'Error recording session: ' + err);
        }
    });
    recordSessionClearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        recordSessionForm.reset();
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) timerDisplay.textContent = '00:00:00';
    });
    recordSessionSubmitBtn.addEventListener('click', function (e) {
        e.preventDefault();
        recordSessionForm.requestSubmit();  // Correct way to trigger a real submit event
    });
});

// Notification system: showNotification(type, message, duration)
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