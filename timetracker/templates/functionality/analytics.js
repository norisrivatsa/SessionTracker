// analytics.js - Handles fetching, parsing, and animating analytics data for analytics.html

// --- Utility: Animated Counter ---
function animateCount(el, from, to, duration, formatFn) {
    const start = performance.now();
    function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const value = from + (to - from) * progress;
        el.textContent = formatFn ? formatFn(value) : Math.round(value);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = formatFn ? formatFn(to) : Math.round(to);
    }
    requestAnimationFrame(step);
}

// --- Fetch Data from Backend ---
async function fetchAnalyticsData(view = 'week') {
    const res = await fetch(`/api/analytics?view=${view}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const data = await res.json();
    // Fetch all sessions for this view for filtering
    const sessionsRes = await fetch(`/api/sessions/${view}`);
    if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        data.allSessions = sessionsData.sessions || [];
    } else {
        data.allSessions = [];
    }
    return data;
}

// --- Fetch Courses for Dropdown ---
async function fetchCourses() {
    const res = await fetch('/api/courses/active');
    if (!res.ok) return [];
    const data = await res.json();
    return data.courses || [];
}

// --- Render Summary Stats ---
function renderSummary(monthlyTotal, maxSession) {
    const monthlyEl = document.getElementById('monthlyHours');
    const maxSessionEl = document.getElementById('maxSession');
    const maxSessionCourseEl = document.getElementById('maxSessionCourse');
    animateCount(monthlyEl, 0, monthlyTotal, 1200, minToHrsMins);
    animateCount(maxSessionEl, 0, maxSession.duration, 1200, minToHrsMins);
    maxSessionCourseEl.textContent = `Longest session: ${maxSession.course}`;
}

// --- Render Bar Graph ---
// function renderBarGraph(labels, data, perCourseGraph = null, courseId = 'all') {
//     const barGraph = document.getElementById('barGraph');
//     const barXLabels = document.getElementById('barXLabels');
//     barGraph.innerHTML = '';
//     barXLabels.innerHTML = '';

//     // Always render a single bar per day, regardless of courseId
//     const maxVal = Math.max(...data, 1);
//     let tooltip = document.getElementById('barGraphTooltip');
//     if (!tooltip) {
//         tooltip = document.createElement('div');
//         tooltip.id = 'barGraphTooltip';
//         tooltip.className = 'bar-tooltip';
//         tooltip.style.position = 'fixed';
//         tooltip.style.pointerEvents = 'none';
//         tooltip.style.opacity = '0';
//         document.body.appendChild(tooltip);
//     }
//     data.forEach((val, i) => {
//         const bar = document.createElement('div');
//         bar.className = 'bar';
//         bar.style.height = '0px';
//         // Bar label
//         const label = document.createElement('div');
//         label.className = 'bar-label';
//         bar.appendChild(label);
//         barGraph.appendChild(bar);
//         // Animate bar height and label
//         animateCount(bar, 0, val, 1000, v => {
//             bar.style.height = `${(v / maxVal) * 100}%`;
//             label.textContent = `${Math.round(v)}m`;
//         });
//         // X axis label
//         const xlabel = document.createElement('div');
//         xlabel.className = 'bar-xlabel';
//         xlabel.textContent = labels[i];
//         barXLabels.appendChild(xlabel);
//         // Tooltip show/hide and follow mouse
//         bar.addEventListener('mouseenter', e => {
//             tooltip.textContent = `${labels[i]}: ${Math.round(val)} min`;
//             tooltip.style.opacity = '1';
//         });
//         bar.addEventListener('mousemove', e => {
//             tooltip.style.left = (e.clientX + 16) + 'px';
//             tooltip.style.top = (e.clientY - 32) + 'px';
//         });
//         bar.addEventListener('mouseleave', () => {
//             tooltip.style.opacity = '0';
//         });
//     });
// }

function renderBarGraph(labels, data, view) {
  const barGraph = document.getElementById('barGraph');
  barGraph.innerHTML = '';

  // Find max to normalize height
  const maxVal = Math.max(...data, 1); 

  // Decide bar width for month vs week
  let barWidth = '14px'; // default week bar width
  if (view === 'month') {
    const daysCount = data.length;
    // total width is 100%, subtract gaps (gap=4px between bars)
    // Calculate width per bar in %
    const totalGapPx = (daysCount - 1) * 4;
    const totalWidthPx = barGraph.clientWidth || 800; // fallback width
    const availableWidthPx = totalWidthPx - totalGapPx;
    const barWidthPx = availableWidthPx / daysCount;

    barWidth = `${barWidthPx}px`;
    barGraph.classList.add('month-view');
  } else {
    barGraph.classList.remove('month-view');
  }

  // Create bars + labels together
  for (let i = 0; i < labels.length; i++) {
    const container = document.createElement('div');
    container.className = 'bar-day-container';

    // Set container width dynamically for month
    if (view === 'month') {
      container.style.width = barWidth;
    } else {
      container.style.width = barWidth;
    }

    const bar = document.createElement('div');
    bar.className = 'bar';

    // Animate bar height (new code)
    const height = (data[i] / maxVal) * 150;
    bar.style.height = '0px';
    bar.style.width = barWidth;
    setTimeout(() => {
      bar.style.transition = 'height 0.8s cubic-bezier(.4,2,.6,1)';
      bar.style.height = `${height}px`;
    }, 10);

    // Tooltip (updated for month view)
    bar.addEventListener('mouseenter', e => {
      let tooltip = document.getElementById('barGraphTooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'barGraphTooltip';
        tooltip.className = 'bar-tooltip';
        tooltip.style.position = 'fixed';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.opacity = '0';
        document.body.appendChild(tooltip);
      }
      const mins = Math.round(data[i]);
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      let tooltiplabel;
      if (view === 'month') {
        tooltiplabel = `Day ${i + 1}`;
      } else {
        tooltiplabel = labels[i];
      }
      tooltip.textContent = `${tooltiplabel}: ${h}h ${m}min`;
      tooltip.style.opacity = '1';
    });
    bar.addEventListener('mousemove', e => {
      let tooltip = document.getElementById('barGraphTooltip');
      if (tooltip) {
        tooltip.style.left = (e.clientX + 16) + 'px';
        tooltip.style.top = (e.clientY - 32) + 'px';
      }
    });
    bar.addEventListener('mouseleave', () => {
      let tooltip = document.getElementById('barGraphTooltip');
      if (tooltip) tooltip.style.opacity = '0';
    });

    const barlabel = document.createElement('div');
    barlabel.className = 'bar-label';
    barlabel.textContent = labels[i];

    container.appendChild(bar);
    container.appendChild(barlabel);
    barGraph.appendChild(container);
  }
}


// --- Render Targets ---
function renderTargets(liveCourses) {
    const row = document.getElementById('targetsRow');
    // Only remove target cards, not headings
    Array.from(row.querySelectorAll('.target-card')).forEach(card => card.remove());
    if (!liveCourses || liveCourses.length === 0) return;
    liveCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'target-card';
        const title = document.createElement('span');
        title.className = 'target-title';
        title.textContent = course.name;
        const value = document.createElement('span');
        value.className = 'target-value ' + (course.timeSpent >= course.weeklyTarget ? 'target-green' : 'target-red');
        value.textContent = `${minToHrsMins(course.timeSpent)} / ${minToHrsMins(course.weeklyTarget)}`;
        card.appendChild(title);
        card.appendChild(value);
        row.appendChild(card);
    });
}

// --- Render Completed Courses ---
function renderCompleted(completedCourses) {
    const row = document.getElementById('completedRow');
    // Only remove target-card elements, not headings
    Array.from(row.querySelectorAll('.target-card, .no-completed')).forEach(card => card.remove());
    if (!completedCourses.length) {
        const msg = document.createElement('div');
        msg.className = 'no-completed';
        msg.textContent = 'COMPLETE SOME COURSES !!!!';
        row.appendChild(msg);
        return;
    }
    completedCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'target-card'; // Use same style as target row
        const title = document.createElement('span');
        title.className = 'target-title';
        title.textContent = course.name;
        const value = document.createElement('span');
        value.className = 'target-value';
        animateCount(value, 0, course.totalTime, 1000, minToHrsMins);
        card.appendChild(title);
        card.appendChild(value);
        row.appendChild(card);
    });
}

// --- Helpers ---
function minToHrsMins(mins) {
    mins = Math.round(mins);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
}

// --- Main Render ---
async function renderAnalytics(view = 'week', courseId = 'all') {
    const params = new URLSearchParams({ view, course: courseId });
    const res = await fetch(`/api/analytics?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const data = await res.json();

    // Populate course dropdown if not already done
    const courseSelect = document.getElementById('graphCourse');
    if (courseSelect && courseSelect.options.length <= 1) {
        const courses = await fetchCourses();
        courseSelect.innerHTML = '<option value="all">All Courses</option>';
        courses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.course_id;
            opt.textContent = c.name;
            courseSelect.appendChild(opt);
        });
    }

    let labels = data.graph.labels;
    let graphData = data.graph.data;
    let perCourseGraph = data.perCourseGraph || null;

    renderSummary(data.monthlyTotal, data.maxSession);
    renderBarGraph(labels, graphData, perCourseGraph, courseId);
    renderTargets(data.liveCourses);
    renderCompleted(data.completedCourses);
}

// --- Listen for dropdown changes ---
document.addEventListener('DOMContentLoaded', function() {
    let currentView = 'week';
    let currentCourse = 'all';
    renderAnalytics(currentView, currentCourse);

    document.getElementById('graphView').addEventListener('change', function(e) {
        currentView = e.target.value;
        renderAnalytics(currentView, currentCourse);
    });
    document.getElementById('graphCourse').addEventListener('change', function(e) {
        currentCourse = e.target.value;
        renderAnalytics(currentView, currentCourse);
    });
});
