<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Record Session</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #fff;
            margin: 0;
            padding: 0;
            color: #222;
        }
        .container {
            width: 100vw;
            min-height: 100vh;
            margin: 0;
            padding: 0;
            background: #fff;
            border-radius: 0;
            box-shadow: none;
            display: flex;
            flex-direction: column;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 32px 5vw 0 5vw;
            margin-bottom: 32px;
        }
        .header h1 {
            font-size: 2.2rem;
            color: #ff5722;
            margin: 0;
        }
        .main-content {
            /* border: 2px solid #ff9800; */
            height: 90vh;
            display: flex;
            flex-direction: column;
            gap: 32px;
            width: 100vw;   
            align-items: center;
            border-radius: 16px 16px 0 0;
        }
        .tab-section {
            width: 80%;
            margin: 0 auto 32px auto;
            background: transparent;
            /* display: flex;
            flex-direction: column;
            align-items: stretch; */
            height: 100%;
            /* border: 2px solid #ff9800; */
        }
        .tab-content {
            width: 90%;
            padding-left: 5%;
            padding-right: 5%;
            background: #fff8f6;
            border-radius: 0 0 16px 16px;
            box-shadow: 0 4px 16px 0 rgba(255, 87, 34, 0.10);
            /* padding-top: 24px; */
            /* padding-bottom: 24px; */
            height: 92%;
            /* border: 2px solid #ff9800; */
            animation: fadeInTab 0.5s cubic-bezier(.4,2,.6,1);
        }
        .form-section, .timer-section {
            height: 100%;
            width: 100%;
            /* padding: 24px; */
            background: #fff8f6;
            border-radius: 16px;
            /* box-shadow: 0 4px 16px 0 rgba(255, 87, 34, 0.10); */
            margin: 0 auto;
            /* border: 2px solid #ff9800; */
        }
        #addSessionForm, #recordSessionForm {
            padding-top: 24px;
            height: 80%;
            width: 100%;
            /* border: 2px solid #ff9800; */
            display: flex;
            flex-direction: column;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-start;
        }
        .form-group {
            padding-top: 12px;
            padding-bottom: 24px;
            height: 20%;
            margin-bottom: 18px;
            width: 40%;
        }
        .form-group label {
            font-weight: 600;
            color: #ff5722;
            display: block;
            margin-bottom: 6px;
        }
        .form-group input, .form-group textarea, .form-group select {
            width: 100%;
            padding: 10px 12px;
            border: 1.5px solid #ff9800;
            border-radius: 8px;
            font-size: 1rem;
            background: #fff;
            color: #222;
            margin-bottom: 4px;
        }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
            outline: none;
            border-color: #ff5722;
        }
        .topics-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 6px;
        }
        .topic-pill {
            background: #fff3e0;
            color: #ff9800;
            border-radius: 16px;
            padding: 4px 14px;
            font-size: 0.98rem;
            font-weight: 500;
            box-shadow: 0 2px 8px 0 rgba(255, 152, 0, 0.10);
        }
        .form-actions {
            display: flex;
            justify-content: space-evenly;
            flex-direction: row;
            align-items: center;
            width: 80%;
            padding-left: 5%;
            padding-right: 5%;
            margin-left: 5%;
            /* border: 2px solid #ff9800; */
        }
        .add-btn, .start-btn, .end-btn , .clear-btn , .reset-btn {
            background: linear-gradient(90deg, #ff9800 0%, #ff5722 100%);
            color: #fff;
            border: none;
            border-radius: 8px;
            padding: 10px 28px;
            font-size: 1rem;
            font-weight: 600;
            box-shadow: 0 2px 8px 0 rgba(255, 87, 34, 0.10);
            cursor: pointer;
            margin-top: 12px;
            margin-right: 10px;
            transition: box-shadow 0.2s, background 0.2s, color 0.2s;
        }
        .add-btn:hover, .start-btn:hover, .end-btn:hover , .clear-btn:hover, .reset-btn:hover {
            box-shadow: 0 4px 16px 0 rgba(255, 87, 34, 0.18);
            background: linear-gradient(90deg, #ff5722 0%, #ff9800 100%);
            color: #fff3e0;
        }
        .timer-display {
            font-size: 2.2rem;
            color: #ff9800;
            font-weight: bold;
            margin: 18px 0 8px 0;
        }
        @media (max-width: 900px) {
            .main-content {
                gap: 24px;
            }
            .form-section, .timer-section {
                width: 98vw;
                max-width: 100vw;
            }
        }
        
        .tabs {
            height: 8%;
            display: flex;
            border-radius: 16px 16px 0 0;
            overflow: hidden;
            box-shadow: 0 2px 8px 0 rgba(255, 152, 0, 0.08);
            background: #fff8f6;
        }
        .tab-btn {
            flex: 1;
            padding: 16px 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #ff5722;
            background: none;
            border: none;
            outline: none;
            cursor: pointer;
            transition: background 0.3s, color 0.3s;
        }
        .tab-btn.active {
            background: linear-gradient(90deg, #ff9800 0%, #ff5722 100%);
            color: #fff;
            box-shadow: 0 4px 16px 0 rgba(255, 87, 34, 0.10);
            z-index: 2;
        }
    
        @keyframes fadeInTab {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .dark-mode .tab-section {
            background: #232323;
        }
        .dark-mode .tabs {
            background: #232323;
            box-shadow: 0 2px 8px 0 rgba(255, 152, 0, 0.13);
        }
        .dark-mode .tab-btn {
            color: #ffb74d;
        }
        .dark-mode .tab-btn.active {
            background: linear-gradient(90deg, #ff9800 0%, #ff5722 100%);
            color: #fff;
        }
        .dark-mode .tab-content {
            background: #232323;
            box-shadow: 0 4px 16px 0 rgba(255, 152, 0, 0.18);
        }
        /* Dark mode styles (copied and adapted from home.html) */
        .dark-mode {
            background: #181818;
            color: #f5f5f5;
        }
        .dark-mode .container {
            background: #181818;
        }
        .dark-mode .header h1 {
            color: #ff9800;
        }
        .dark-mode .form-section, .dark-mode .timer-section {
            background: #232323;
            /* box-shadow: 0 4px 16px 0 rgba(255, 152, 0, 0.18); */
        }
        .dark-mode .form-group label {
            color: #ffb74d;
        }
        .dark-mode .form-group input, .dark-mode .form-group textarea, .dark-mode .form-group select {
            background: #232323;
            color: #f5f5f5;
            border-color: #ffb74d;
        }
        .dark-mode .form-group input:focus, .dark-mode .form-group textarea:focus, .dark-mode .form-group select:focus {
            border-color: #ff9800;
        }
        .dark-mode .topics-list .topic-pill {
            background: #2d2d2d;
            color: #fff;
        }
        .dark-mode .add-btn, .dark-mode .start-btn, .dark-mode .end-btn, .dark-mode .clear-btn , .dark-mode .reset-btn {
            background: linear-gradient(90deg, #ff9800 0%, #ff5722 100%);
            color: #ffb74d;
        }
        .dark-mode .add-btn:hover, .dark-mode .start-btn:hover, .dark-mode .end-btn:hover, .dark-mode .clear-btn:hover , .dark-mode .reset-btn:hover {
            box-shadow: 0 4px 16px 0 rgba(255, 152, 0, 0.18);
            background: linear-gradient(90deg, #ff5722 0%, #ff9800 100%);
            color: #fff;
        }
        .dark-mode .timer-display {
            color: #ff9800;
        }

         /* Navbar styles (copied from home.html) */
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 0;
            background: linear-gradient(180deg, #fff3e0 0%, #ffe0b2 100%);
            box-shadow: 4px 0 24px 0 rgba(255, 87, 34, 0.10);
            overflow-x: hidden;
            transition: width 0.3s cubic-bezier(.4,2,.6,1), box-shadow 0.3s;
            z-index: 1001;
            display: flex;
            flex-direction: column;
            padding-top: 60px;
        }
        .navbar.open {
            width: 20%;
            box-shadow: 4px 0 32px 0 rgba(255, 87, 34, 0.18);
        }
        .navbar-toggle {
            background: linear-gradient(90deg, #ff9800 0%, #ff5722 100%);
            color: #fff;
            border: none;
            border-radius: 10px;
            padding: 8px 18px;
            font-size: 1.4rem;
            font-weight: 600;
            box-shadow: 0 2px 8px 0 rgba(255, 87, 34, 0.10);
            cursor: pointer;
            margin-right: 18px;
            margin-left: -8px;
            transition: box-shadow 0.2s, color 0.2s, transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .navbar-toggle:hover {
            color: #fff3e0;
            box-shadow: 0 4px 16px 0 rgba(255, 87, 34, 0.18);
            transform: scale(1.08);
        }
        .navbar .close-btn {
            position: absolute;
            top: 18px;
            right: 18px;
            background: none;
            border: none;
            font-size: 1.6rem;
            color: #ff5722;
            cursor: pointer;
        }
        .navbar ul {
            list-style: none;
            padding: 0 0 0 24px;
            margin: 0;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            gap: 12px;
        }
        .navbar-elements {
            width: 80%;
            border-radius: 12px;
            transition: color 0.2s, background 0.2s, box-shadow 0.25s, transform 0.25s;
        }
        .navbar a {
            width: 80%;
            text-decoration: none;
            color: #ff5722;
            font-size: 1.15rem;
            font-weight: 600;
            display: inline-block;
            padding: 14px 32px;
        }
        .navbar-elements:hover {
            color: #ff9800;
            background: #fff3e0;
            transform: scale(1.08);
            box-shadow: 0 4px 18px 0 rgba(255, 87, 34, 0.18), 0 2px 8px 0 rgba(255, 152, 0, 0.12);
        }
        .navbar-bg {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0,0,0,0.18);
            z-index: 1000;
        }
        .navbar.open ~ .navbar-bg {
            display: block;
        }
        .dark-mode .navbar {
            background: linear-gradient(180deg, #232323 0%, #181818 100%);
            box-shadow: 4px 0 24px 0 rgba(255, 152, 0, 0.13);
        }
        .dark-mode .navbar a {
            color: #ffb74d;
        }
        .dark-mode .navbar-elements:hover {
            background: #232323;
            box-shadow: 0 4px 18px 0 rgba(255, 152, 0, 0.22), 0 2px 8px 0 rgba(255, 87, 34, 0.14);
            color: #ff9800;
        }
        .dark-mode .navbar .close-btn,
        .dark-mode .navbar-toggle {
            color: #ffb74d;
        }
        .dark-mode .navbar-toggle:hover {
            color: #ff9800;
        }
        .dark-mode .navbar.open {
            box-shadow: 4px 0 32px 0 rgba(255, 152, 0, 0.18);
        }

        /* Notification styles (independent, do not change existing styles) */
        #notification-container {
            min-width: 260px;
            max-width: 350px;
            pointer-events: none;
            bottom: 32px;
            top: auto;
            right: 32px;
            position: fixed;
        }
        .notification {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #fff;
            color: #222;
            border-radius: 10px;
            box-shadow: 0 4px 18px 0 rgba(255, 87, 34, 0.18);
            padding: 18px 28px;
            font-size: 1.08rem;
            font-weight: 500;
            margin-bottom: 18px;
            opacity: 0;
            transform: translateY(-20px);
            animation: notification-in 0.35s cubic-bezier(.4,2,.6,1) forwards;
            border-left: 6px solid #ff9800;
            pointer-events: auto;
        }
        .notification.success {
            border-left-color: #4caf50;
            background: #e8f5e9;
            color: #256029;
        }
        .notification.fail {
            border-left-color: #f44336;
            background: #ffebee;
            color: #b71c1c;
        }
        .notification .close-btn {
            margin-left: auto;
            background: none;
            border: none;
            color: inherit;
            font-size: 1.3rem;
            cursor: pointer;
            pointer-events: auto;
        }
        @keyframes notification-in {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        @keyframes notification-out {
            to {
                opacity: 0;
                transform: translateY(-20px);
            }
        }
        .dark-mode #notification-container .notification {
            background: #232323;
            color: #f5f5f5;
        }
        .dark-mode #notification-container .notification.success {
            background: #1b3c1b;
            color: #b9f6ca;
        }
        .dark-mode #notification-container .notification.fail {
            background: #3c1b1b;
            color: #ffcdd2;
        }
    </style> 

</head>
<body>
    <div class="navbar" id="navbar">
        <button class="close-btn" id="closeNavbar" aria-label="Close navigation">&times;</button>
        <ul id="navbarLinks">
            <li class="navbar-elements"><a href="/home">Home</a></li>
            <li class="navbar-elements"><a href="/courses">courses</a></li>
            <li class="navbar-elements"><a href="/record_sessions">Record Session</a></li>
            <li class="navbar-elements"><a href="/all_sessions">All sessions</a></li>
            <li class="navbar-elements"><a href="/analytics">Analytics</a></li>
        </ul>
    </div>
    <div class="navbar-bg" id="navbarBg"></div>
    <div class="container">
        <div class="header">
            <button class="navbar-toggle" id="openNavbar" aria-label="Open navigation">&#9776;</button>
            <h1>Record Session</h1>
            <button id="mode-toggle" aria-label="Toggle dark/light mode" style="background: linear-gradient(90deg, #ff9800 0%, #ff5722 100%); color: #fff; border: none; border-radius: 20px; padding: 8px 22px; font-size: 1rem; font-weight: 600; box-shadow: 0 2px 8px 0 rgba(255, 87, 34, 0.10); cursor: pointer; transition: box-shadow 0.2s;">🌙 Dark Mode</button>
        </div>
        <div class="main-content">
            <div class="tab-section">
                <div class="tabs">
                    <button class="tab-btn active" id="tabAdd">Add Session</button>
                    <button class="tab-btn" id="tabRecord">Record Session</button>
                </div>
                <div class="tab-content" id="tabAddContent">
                    <div class="form-section">
                        <form id="addSessionForm">
                            <div class="form-group">
                                <label for="session_name">Session Name</label>
                                <input type="text" id="session_name" name="session_name" required />
                            </div>
                            <div class="form-group">
                                <label for="session_description">Session Description</label>
                                <textarea id="session_description" name="session_description" rows="2"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="course_id">Course</label>
                                <select id="course_id" name="course_id" required>
                                    <option value="">Loading...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="topics">Topics (comma separated)</label>
                                <input type="text" id="topics" name="topics" placeholder="e.g. Algebra, Calculus" />
                            </div>
                            <div class="form-group">
                                <label for="date">Date</label>
                                <input type="date" id="date" name="date" required />
                            </div>
                            <div class="form-group">
                                <div>
                                    <label for="started_at">Started At (Time)</label>
                                    <input type="time" id="started_at" name="started_at" required />
                                </div>
                                <div>
                                    <label for="ended_at">Ended At (Time)</label>
                                    <input type="time" id="ended_at" name="ended_at" required />
                                </div>
                            </div>
                        </form>
                        <div class ="form-actions">
                            <button class="clear-btn">Clear Fields</button>
                            <button type="submit" class="add-btn">Add Session</button>
                        </div>
                    </div>
                </div>
                <div class="tab-content" id="tabRecordContent" style="display:none;">
                    <div class="timer-section">
                        <form id="recordSessionForm">
                            <div class="form-group">
                                <label for="session_name_timer">Session Name</label>
                                <input type="text" id="session_name_timer" name="session_name_timer" required />
                            </div>
                            <div class="form-group">
                                <label for="session_description_timer">Session Description</label>
                                <textarea id="session_description_timer" name="session_description_timer" rows="2"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="course_id_timer">Course</label>
                                <select id="course_id_timer" name="course_id_timer" required>
                                    <option value="">Loading...</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="topics_timer">Topics (comma separated)</label>
                                <input type="text" id="topics_timer" name="topics_timer" placeholder="e.g. Algebra, Calculus" />
                            </div>
                            <div class="form-group">
                                <label for="date_timer">Date</label>
                                <input type="date" id="date_timer" name="date_timer" required />
                            </div>
                            <div class="form-group">
                                <label>Timer</label>
                                <div class="timer-display" id="timerDisplay">00:00:00</div>
                                <button type="button" class="start-btn" id="startTimer">Start</button>
                                <button type="button" class="end-btn" id="endTimer" disabled>End</button>
                                <button type="button" class="reset-btn">Reset</button>
                                <input type="hidden" id="started_at_timer" name="started_at_timer" />
                                <input type="hidden" id="ended_at_timer" name="ended_at_timer" />
                                <input type="hidden" id="time_spent_timer" name="time_spent_timer" />
                            </div>
                        </form>
                        <div class="form-actions">  
                            <button class="clear-btn">Clear Fields</button>
                            <button type="submit" class="add-btn" id="recordSessionBtn">Record Session</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Notification Container -->
    <div id="notification-container" style="position: fixed; bottom: 32px; right: 32px; z-index: 2000; display: none;"></div>
    <script>
        // Dark/Light mode toggle
        const modeToggle = document.getElementById('mode-toggle');
        const body = document.body;
        let dark = false;
        function setMode(isDark) {
            if (isDark) {
                body.classList.add('dark-mode');
                modeToggle.textContent = '☀️ Light Mode';
            } else {
                body.classList.remove('dark-mode');
                modeToggle.textContent = '🌙 Dark Mode';
            }
        }
        if (localStorage.getItem('darkMode') === 'true') {
            dark = true;
            setMode(true);
        }
        modeToggle.addEventListener('click', () => {
            dark = !dark;
            setMode(dark);
            localStorage.setItem('darkMode', dark);
        });
        // Navbar functionality
        const navbar = document.getElementById('navbar');
        const openNavbar = document.getElementById('openNavbar');
        const closeNavbar = document.getElementById('closeNavbar');
        const navbarBg = document.getElementById('navbarBg');
        openNavbar.addEventListener('click', () => {
            navbar.classList.add('open');
            navbarBg.style.display = 'block';
        });
        closeNavbar.addEventListener('click', () => {
            navbar.classList.remove('open');
            navbarBg.style.display = 'none';
        });
        navbarBg.addEventListener('click', () => {
            navbar.classList.remove('open');
            navbarBg.style.display = 'none';
        });
        // Timer functionality
        let timerInterval;
        let startTime;
        let elapsed = 0;
        const timerDisplay = document.getElementById('timerDisplay');
        const startBtn = document.getElementById('startTimer');
        const endBtn = document.getElementById('endTimer');
        const startedAtInput = document.getElementById('started_at_timer');
        const endedAtInput = document.getElementById('ended_at_timer');
        const timeSpentInput = document.getElementById('time_spent_timer');
        function formatTime(ms) {
            const totalSeconds = Math.floor(ms / 1000);
            const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
            const seconds = String(totalSeconds % 60).padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }
        startBtn.addEventListener('click', () => {
            startTime = Date.now();
            startedAtInput.value = new Date().toISOString();
            startBtn.disabled = true;
            endBtn.disabled = false;
            timerInterval = setInterval(() => {
                elapsed = Date.now() - startTime;
                timerDisplay.textContent = formatTime(elapsed);
            }, 1000);
        });
        endBtn.addEventListener('click', () => {
            clearInterval(timerInterval);
            endBtn.disabled = true;
            startBtn.disabled = false;
            endedAtInput.value = new Date().toISOString();
            const totalMs = Date.parse(endedAtInput.value) - Date.parse(startedAtInput.value);
            timeSpentInput.value = Math.floor(totalMs / 60000); // minutes
        });
        // Tab functionality
        const tabAdd = document.getElementById('tabAdd');
        const tabRecord = document.getElementById('tabRecord');
        const tabAddContent = document.getElementById('tabAddContent');
        const tabRecordContent = document.getElementById('tabRecordContent');
        tabAdd.addEventListener('click', function() {
            tabAdd.classList.add('active');
            tabRecord.classList.remove('active');
            tabAddContent.style.display = '';
            tabRecordContent.style.display = 'none';
            tabAddContent.classList.remove('fadeOutTab');
            tabAddContent.classList.add('fadeInTab');
        });
        tabRecord.addEventListener('click', function() {
            tabRecord.classList.add('active');
            tabAdd.classList.remove('active');
            tabRecordContent.style.display = '';
            tabAddContent.style.display = 'none';
            tabRecordContent.classList.remove('fadeOutTab');
            tabRecordContent.classList.add('fadeInTab');
        });
        // Add Session form handler (dummy, replace with backend call)
        document.getElementById('addSessionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Session added! (Implement backend call)');
        });
        // Record Session form handler (dummy, replace with backend call)
        document.getElementById('recordSessionForm').addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Session recorded! (Implement backend call)');
        });
    </script>
    <script src="functionality/record_session.js"></script>
</body>
</html>