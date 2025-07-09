import subprocess
import time
import socket
import webbrowser
import os
import argparse
import sys

APP_NAME = "SessionTracker"
PORT = 5000
HOST = "localhost"
URL = f"http://{HOST}:{PORT}"
# Relative path from launcher.py to main.py
MAIN_REL_PATH = os.path.join("timetracker", "main.py")
LOG_FILE = f"{APP_NAME.lower()}.log"

def get_base_dir():
    """Get the base directory, handling both script and PyInstaller executable"""
    if getattr(sys, 'frozen', False):
        # Running as PyInstaller executable
        return os.path.dirname(sys.executable)
    else:
        # Running as Python script
        return os.path.dirname(os.path.abspath(__file__))

def is_port_open(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def launch(debug=False):
    base_dir = get_base_dir()  # Use the new function
    main_path = os.path.abspath(os.path.join(base_dir, MAIN_REL_PATH))
    timetracker_dir = os.path.dirname(main_path)  # directory containing main.py
    log_path = os.path.join(base_dir, LOG_FILE)
    
    # Verify that the timetracker directory and main.py exist
    if not os.path.exists(timetracker_dir):
        print(f"❌ Error: timetracker directory not found at {timetracker_dir}")
        print(f"   Current base directory: {base_dir}")
        return
    
    if not os.path.exists(main_path):
        print(f"❌ Error: main.py not found at {main_path}")
        return
    
    print(f"🚀 Launching {APP_NAME} using 'uv run main.py' in directory {timetracker_dir}...")
    
    stdout = stderr = None
    if debug:
        print(f"🔍 Debug mode ON — logging to {log_path}")
        log_file = open(log_path, "w")
        stdout = stderr = log_file
    else:
        log_file = None
    
    process = subprocess.Popen(
        ["uv", "run", "main.py"],
        cwd=timetracker_dir,
        stdout=stdout,
        stderr=stderr
    )
    
    for _ in range(30):
        if is_port_open(HOST, PORT):
            break
        time.sleep(0.5)
    else:
        print("⚠️ Server did not start in time.")
        process.terminate()
        if log_file:
            log_file.close()
        return
    
    try:
        chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"
        if os.path.exists(chrome_path):
            webbrowser.register('chrome', None, webbrowser.BackgroundBrowser(chrome_path))
            webbrowser.get('chrome').open(URL)
        else:
            webbrowser.open(URL)
    except Exception as e:
        print(f"Could not open browser: {e}")
    
    print(f"✅ {APP_NAME} is running at {URL}. Press Ctrl+C to stop.")
    try:
        process.wait()
    except KeyboardInterrupt:
        print("🛑 Interrupted by user.")
        process.terminate()
    finally:
        if log_file:
            log_file.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=f"{APP_NAME} Launcher")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging to sessiontracker.log")
    args = parser.parse_args()
    launch(debug=args.debug)