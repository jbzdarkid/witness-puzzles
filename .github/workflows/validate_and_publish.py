from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
import chromedriver_autoinstaller
from pyvirtualdisplay import Display
display = Display(visible=0, size=(800, 800))  
display.start()

chromedriver_autoinstaller.install()  # Check if the current version of chromedriver exists
                                      # and if it doesn't exist, download it automatically,
                                      # then add chromedriver to path

chrome_options = webdriver.ChromeOptions()    
# Add your options as needed    
options = [
  # Define window size here
   "--window-size=1200,1200",
    "--ignore-certificate-errors"
 
    #"--headless",
    #"--disable-gpu",
    #"--window-size=1920,1200",
    #"--ignore-certificate-errors",
    #"--disable-extensions",
    #"--no-sandbox",
    #"--disable-dev-shm-usage",
    #'--remote-debugging-port=9222'
]

for option in options:
    chrome_options.add_argument(option)

    
driver = webdriver.Chrome(options = chrome_options)

driver.get('http://github.com')
print(driver.title)
with open('./GitHub_Action_Results.txt', 'w') as f:
    f.write(f"This was written with a GitHub action {driver.title}")



exit()


























from pathlib import Path
from time import sleep
import json
import os
import requests
import subprocess
import sys

"""
print('Loading puzzle submission...')
api = f'https://api.github.com/repos/{os.environ["GITHUB_REPOSITORY"]}'
headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': 'Bearer ' + os.environ['GITHUB_TOKEN'],
    'User-Agent': 'Witness Puzzles/3.0 (https://github.com/jbzdarkid/witness-puzzles)',
}
"""

from pyvirtualdisplay import Display
Display(visible=0, size=(800, 800)).start()

print('Installing chrome...')
chrome_version = '110.0.5481.177-1'
subprocess.run([
    'wget',
    '--no-verbose',
    '-O', '/tmp/chrome.deb',
    f'https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_{chrome_version}_amd64.deb',
], check=True)
subprocess.run(['sudo', 'dpkg', '-i', '/tmp/chrome.deb'], check=True)
subprocess.run(['sudo', 'apt', '--fix-broken', 'install', '-y'], check=True)


contents = open('.github/workflows/validate.html', 'r', encoding='utf-8').read()
puzzle = sys.argv[1]
contents = contents.replace('%puzzle%', puzzle) # Let javascript do the object load; we'll be happy with whatever.

tempfile = Path('temp.html').resolve()
with tempfile.open('w', encoding='utf-8') as f:
    f.write(contents.replace('%puzzle%', puzzle))


# https://developer.chrome.com/articles/new-headless
dom = subprocess.check_output(['google-chrome-stable', tempfile.as_uri(), '--window-size=1200,1200', '--ignore-certificate-errors', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--headless=new', '--dump-dom'], text=True, encoding='utf-8')
print(dom)







exit()


from chromedriver_py import binary_path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, JavascriptException

options = webdriver.chrome.options.Options()
options.add_argument('headless')
os.environ['LD_LIBRARY_PATH'] = '/opt/google/chrome/lib/:' + os.environ.get('LD_LIBRARY_PATH', '')
validate_page = 'file:///' + __file__.replace(__name__ + '.py', 'pages/validate.html')
service = webdriver.chrome.service.Service(executable_path=binary_path)
driver = webdriver.Chrome(options=options, service=service)
driver.get(validate_page)

# Wait for page to load, then run the script and wait for a response.
driver.refresh()
WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, 'puzzle')))
driver.execute_script(f'validate_and_capture_image({json.dumps(solution_json)})') # JSON escapement for solution_json
result = WebDriverWait(driver, 60).until(EC.presence_of_element_located((By.ID, 'result')))
data = json.loads(result.get_attribute('data'))

print(data)


"""
print('Verifying puzzle...')
os.environ['LD_LIBRARY_PATH'] = '/opt/google/chrome/lib/:' + os.environ.get('LD_LIBRARY_PATH', '')
os.environ['DBUS_SESSION_BUS_ADDRESS'] = 'unix:path=/run/user/1000/bus'

# https://developer.chrome.com/articles/new-headless
dom = subprocess.check_output(['google-chrome-stable', tempfile.as_uri(), '--headless=new', '--dump-dom'], text=True, encoding='utf-8')

print(dom)
"""

"""
h = sha256()
h.update(puzzle_json.encode())
display_hash = h.hexdigest()[:8].upper()
display_hash = display_hash.replace('I', 'A')
display_hash = display_hash.replace('O', 'B')
display_hash = display_hash.replace('1', 'C')
display_hash = display_hash.replace('0', 'D')
puzzle = get_puzzle(display_hash)

with open('.github/workflows/play_template.html', 'r', encoding='utf-8') as f:
    contents = f.read()

contents = contents
    .replace('%title%', puzzle.name)
    .replace('%display_hash%', puzzle.display_hash)
    .replace('%solution%', puzzle.display_hash)
    .replace('%puzzle%', puzzle.display_hash)
    .replace('%image%', puzzle.display_hash)
"""





















