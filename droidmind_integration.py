"""
DroidMind Integration for Sportea-App Testing and Development
"""

import json
import os
import requests
import sys
import time
from datetime import datetime

# DroidMind API endpoint
DROIDMIND_API = "http://localhost:4256/api"

class SporteaAppTester:
    """Helper class for testing Sportea-App with DroidMind"""
    
    def __init__(self):
        """Initialize the tester"""
        self.device_serial = self._get_device_serial()
        self.screenshots_dir = os.path.join(os.getcwd(), "test_screenshots")
        os.makedirs(self.screenshots_dir, exist_ok=True)
    
    def _get_device_serial(self):
        """Get the serial number of the first connected device"""
        response = requests.post(
            DROIDMIND_API,
            json={"method": "devicelist", "params": {}}
        )
        
        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            print(response.text)
            sys.exit(1)
        
        data = response.json()
        if "error" in data:
            print(f"Error: {data['error']}")
            sys.exit(1)
        
        devices = data.get("result", [])
        if not devices:
            print("No devices found. Make sure your emulator or device is connected.")
            sys.exit(1)
        
        print(f"Using device: {devices[0]['serial']}")
        return devices[0]['serial']
    
    def take_screenshot(self, name):
        """Take a screenshot and save it with a descriptive name"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{name}_{timestamp}.png"
        
        response = requests.post(
            DROIDMIND_API,
            json={"method": "screenshot", "params": {"serial": self.device_serial}}
        )
        
        if response.status_code != 200:
            print(f"Error taking screenshot: {response.status_code}")
            print(response.text)
            return None
        
        data = response.json()
        if "error" in data:
            print(f"Error taking screenshot: {data['error']}")
            return None
        
        screenshot_path = data.get("result", "")
        
        # Copy the screenshot to our test_screenshots directory with a descriptive name
        new_path = os.path.join(self.screenshots_dir, filename)
        os.rename(screenshot_path, new_path)
        
        print(f"Screenshot saved to: {new_path}")
        return new_path
    
    def run_shell_command(self, command):
        """Run a shell command on the device"""
        response = requests.post(
            DROIDMIND_API,
            json={"method": "shell_command", "params": {"serial": self.device_serial, "command": command}}
        )
        
        if response.status_code != 200:
            print(f"Error running command: {response.status_code}")
            print(response.text)
            return None
        
        data = response.json()
        if "error" in data:
            print(f"Error running command: {data['error']}")
            return None
        
        return data.get("result", "")
    
    def get_app_logs(self, package_name="com.sportea.app", lines=100):
        """Get logs for the Sportea app"""
        command = f"logcat -d -v threadtime -t {lines} | grep {package_name}"
        return self.run_shell_command(command)
    
    def clear_app_data(self, package_name="com.sportea.app"):
        """Clear app data for testing"""
        command = f"pm clear {package_name}"
        return self.run_shell_command(command)
    
    def launch_app(self, package_name="com.sportea.app", activity="com.sportea.app.MainActivity"):
        """Launch the Sportea app"""
        command = f"am start -n {package_name}/{activity}"
        return self.run_shell_command(command)
    
    def test_app_flow(self):
        """Test the main app flow and take screenshots"""
        # Take screenshot of the app's initial state
        self.take_screenshot("initial_state")
        
        # Wait for app to fully load
        time.sleep(2)
        
        # Take screenshot of the login screen
        self.take_screenshot("login_screen")
        
        # More test steps can be added here
        
        print("App flow test completed")


if __name__ == "__main__":
    print("Starting Sportea-App testing with DroidMind...")
    tester = SporteaAppTester()
    
    # Example usage
    if len(sys.argv) > 1 and sys.argv[1] == "screenshot":
        tester.take_screenshot("manual_capture")
    elif len(sys.argv) > 1 and sys.argv[1] == "logs":
        logs = tester.get_app_logs()
        print(logs)
    elif len(sys.argv) > 1 and sys.argv[1] == "clear":
        tester.clear_app_data()
        print("App data cleared")
    elif len(sys.argv) > 1 and sys.argv[1] == "launch":
        tester.launch_app()
        print("App launched")
    elif len(sys.argv) > 1 and sys.argv[1] == "test":
        tester.test_app_flow()
    else:
        print("Available commands:")
        print("  screenshot - Take a screenshot")
        print("  logs - Get app logs")
        print("  clear - Clear app data")
        print("  launch - Launch the app")
        print("  test - Run the full test flow")
