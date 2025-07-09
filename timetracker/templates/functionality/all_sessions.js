// All Sessions page logic

function minToHrsMins(mins) {
    mins = Math.round(mins);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

async function fetchCourses() {
    const res = await fetch('/api/courses/active');
    if (!res.ok) return [];
    const data = await res.json();
    return data.courses || [];
}

async function fetchSessions(course_id) {
    const res = await fetch(`/api/sessions/by_course?course_id=${encodeURIComponent(course_id)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions || [];
}

function renderCourseDropdown(courses) {
    const select = document.getElementById('courseSelect');
    select.innerHTML = '';
    courses.forEach(c => {
        // Compose option with course name and type (type at right, small/dark)
        const opt = document.createElement('option');
        opt.value = c.course_id;
        opt.textContent = `${c.course_type} ${c.name} `;

        select.appendChild(opt);
    });
    // Add type label after rendering (for browsers that support innerHTML in option)
    
}

let selectedSessionId = null;

function renderSessions(sessions) {
    const list = document.getElementById('sessionList');
    if (!sessions.length) {
        list.innerHTML = '<div style="color:#888;font-size:1.1rem;margin-top:24px;">No sessions found for this course.</div>';
        selectedSessionId = null;
        return;
    }
    list.innerHTML = sessions.map((s, idx) => `
        <div class="session-card" id="session-card-${idx}" data-session-id="${s.session_id || ''}">
            <div class="session-main">
                <span class="session-title">${s.session_name || '(No Name)'}</span>
                <span class="session-date">${s.date || ''}</span>
                <span class="session-time">${minToHrsMins(s.time_spent || 0)}</span>
                <button class="expand-btn" data-idx="${idx}">&#9660;</button>
            </div>
            <div class="session-details" id="session-details-${idx}">
                <div><span class="session-label">Topics:</span> ${s.session_topics || '<i>No description</i>'}</div>
                <div><span class="session-label">Description:</span> ${s.session_description || '<i>No description</i>'}</div>
                <div><span class="session-label">Start Time:</span> ${s.started_at || '-'}</div>
                <div><span class="session-label">End Time:</span> ${s.ended_at || '-'}</div>
            </div>
        </div>
    `).join('');
    // Expand/collapse logic
    sessions.forEach((_, idx) => {
        const btn = document.querySelector(`#session-card-${idx} .expand-btn`);
        const details = document.getElementById(`session-details-${idx}`);
        btn.onclick = function () {
            const isHidden = details.style.display === 'none' || details.style.display === '';
            details.style.display = isHidden ? 'flex' : 'none';
            btn.innerHTML = isHidden ? '&#9650;' : '&#9660;';
        };
    });
    // Radio select logic
    document.querySelectorAll('.select-session-radio').forEach(radio => {
        radio.onclick = function() {
            selectedSessionId = this.getAttribute('data-session-id');
        };
    });
}



async function main() {
    const courses = await fetchCourses();
    if (!courses.length) {
        document.getElementById('courseSelect').innerHTML = '<option>No courses found</option>';
        document.getElementById('sessionList').innerHTML = '';
        return;
    }
    renderCourseDropdown(courses);
    // Initial load: show sessions for first course
    let selectedCourseId = courses[0].course_id;
    let sessions = await fetchSessions(selectedCourseId);
    renderSessions(sessions);

    document.getElementById('courseSelect').addEventListener('change', async function() {
        const courseId = this.value;
        const sessions = await fetchSessions(courseId);
        renderSessions(sessions);
        selectedSessionId = null;
    });

    document.getElementById('deleteSessionBtn').addEventListener('click', function() {
        deleteSession(selectedSessionId);
    });
}

document.addEventListener('DOMContentLoaded', main);

 // Modal logic for delete session
    document.addEventListener('DOMContentLoaded', function() {
        const openBtn = document.getElementById('openDeleteSessionModal');
        const modal = document.getElementById('deleteSessionModal');
        const closeBtn = document.getElementById('closeDeleteSessionModal');
        const courseSelect = document.getElementById('courseSelect');
        const sessionSelect = document.getElementById('delete_session_select');
        const form = document.getElementById('deleteSessionForm');

        openBtn.onclick = async function() {
            // Populate session select based on selected course
            const courseId = courseSelect.value;
            sessionSelect.innerHTML = '<option>Loading...</option>';
            try {
                const res = await fetch(`/api/sessions/by_course?course_id=${encodeURIComponent(courseId)}`);
                const data = await res.json();
                const sessions = data.sessions || [];
                if (!sessions.length) {
                    sessionSelect.innerHTML = '<option value="">No sessions available</option>';
                } else {
                    sessionSelect.innerHTML = sessions.map(s =>
                        `<option value="${s.session_id}">${s.session_name || '(No Name)'} | ${s.date || ''} | ${Math.floor((s.time_spent || 0)/60)}h ${(s.time_spent || 0)%60}m</option>`
                    ).join('');
                }
            } catch {
                sessionSelect.innerHTML = '<option value="">Error loading sessions</option>';
            }
            modal.style.display = 'block';
        };
        closeBtn.onclick = function() { modal.style.display = 'none'; };
        window.onclick = function(event) {
            if (event.target == modal) modal.style.display = 'none';
        };
        form.onsubmit = async function(e) {
            e.preventDefault();
            const sessionId = sessionSelect.value;
            console.log('Deleting session:', sessionId);
            if (!sessionId) {
                showNotification('fail', 'Please select a session to delete.');
                return;
            }
            try {
                const resp = await fetch(`/api/session/delete?session_id=${encodeURIComponent(sessionId)}`, {
                    method: 'DELETE'
                });
                if (resp.ok) {
                    showNotification('success', 'Session deleted successfully!');
                    modal.style.display = 'none';
                    // Refresh session list
                    const courseId = courseSelect.value;
                    const sessions = await fetchSessions(courseId);
                    renderSessions(sessions);
                } else {
                    const err = await resp.json();
                    showNotification('fail', 'Failed to delete session: ' + (err.detail || resp.statusText));
                }
            } catch (err) {
                showNotification('fail', 'Error deleting session: ' + err.message);
            }
        };
    });



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
