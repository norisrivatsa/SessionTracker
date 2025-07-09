const modeToggle = document.getElementById("mode-toggle");
const body = document.body;
let dark = false;
function setMode(isDark) {
  if (isDark) {
    body.classList.add("dark-mode");
    modeToggle.textContent = "☀️ Light Mode";
  } else {
    body.classList.remove("dark-mode");
    modeToggle.textContent = "🌙 Dark Mode";
  }
}
// Load mode from localStorage
if (localStorage.getItem("darkMode") === "true") {
  dark = true;
  setMode(true);
}
modeToggle.addEventListener("click", () => {
  dark = !dark;
  setMode(dark);
  localStorage.setItem("darkMode", dark);
});
// Navbar functionality
const navbar = document.getElementById("navbar");
const openNavbar = document.getElementById("openNavbar");
const closeNavbar = document.getElementById("closeNavbar");
const navbarBg = document.getElementById("navbarBg");
openNavbar.addEventListener("click", () => {
  navbar.classList.add("open");
  navbarBg.style.display = "block";
});
closeNavbar.addEventListener("click", () => {
  navbar.classList.remove("open");
  navbarBg.style.display = "none";
});
navbarBg.addEventListener("click", () => {
  navbar.classList.remove("open");
  navbarBg.style.display = "none";
});
// Fetch and render active courses and this week's sessions
async function fetchAndRenderHomeData() {
  // Fetch active courses
  let courses = [];
  try {
    const resp = await fetch('/api/courses/active');
    if (resp.ok) {
      const data = await resp.json();
      courses = data.courses || [];
    }
  } catch (e) { /* Optionally show error */ }

  // Fetch this week's sessions
  let sessions = [];
  try {
    const resp = await fetch('/api/sessions/week');
    if (resp.ok) {
      const data = await resp.json();
      sessions = data.sessions || [];
    }
  } catch (e) { /* Optionally show error */ }

  // Render current session (active courses)
  const currentSessionDiv = document.querySelector('.current-session');

if (courses.length > 0) {
  currentSessionDiv.innerHTML = `<h2>Current Sessions</h2>`;
  
  courses.forEach(course => {
    const courseItem = document.createElement('div');
    courseItem.classList.add('course-item');
    
    courseItem.innerHTML = `
    <div class="course-info">
      <div class="course-namedate">
        <div class="course-name">${course.name}</div>
        <div class="session-date">
          Started: ${course.started_on ? new Date(course.started_on).toLocaleString() : 'Not started'}
        </div>
      </div>
      <div class="time-spent">
        ${Math.floor((course.total_time_spent || 0) / 60)}h ${(course.total_time_spent || 0) % 60}m
      </div>
    `;
    
    currentSessionDiv.appendChild(courseItem);
  });

} else {
  currentSessionDiv.innerHTML = `
    <h2>Current Sessions</h2>
    <div>No active courses.</div>
  `;
}


  // Render recorded sessions (this week)
  const sessionsListDiv = document.querySelector('.sessions-list');
  if (sessions.length > 0) {
    sessionsListDiv.innerHTML = `<h3>Recorded Sessions</h3>` +
      sessions.map(session => `
        <div class="session-item">
          <div class="session-info">
            <span class="session-course">${session.course_name || ''}</span>
            <span class="session-time">${Math.floor((session.time_spent||0)/60)}h ${(session.time_spent||0)%60}m</span>
            <span class="session-date">
  ${session.date && session.started_at ? new Date(`${session.date}T${session.started_at}`).toLocaleString() : ''}
</span>

          </div>
        </div>
      `).join('');
  } else {
    sessionsListDiv.innerHTML = `<h3>Recorded Sessions</h3><div>No sessions recorded this week.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', fetchAndRenderHomeData);
