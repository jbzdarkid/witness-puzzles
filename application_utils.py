from flask import Flask, redirect, send_from_directory
import os
import json
import threading
from chromedriver_py import binary_path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException, JavascriptException
from PIL import Image
import boto3

from application_secrets import secrets

application = Flask(__name__, template_folder='pages')
application.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
application.config['SQLALCHEMY_DATABASE_URI'] = secrets.get_database_uri()
# application.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
#   'connect_timeout': 10, # seconds
# }
application.config['SECRET_KEY'] = secrets.SECRET_KEY

if secrets: # Running on a server
  application.debug = False
else: # Running locally
  def disable_caching(request):
    request.headers['Cache-Control'] = 'no-cache'
    return request
  application.after_request(disable_caching) # Auto-reload should not cache contents.
  application.debug = True # Required to do auto-reload

def __static_content_func(filename):
  root, file = filename.rsplit('/', 1)
  return send_from_directory(root, file)

# Recursively host folders, files, with custom paths per request.
def host_statically(path, serverpath=None):
  path = path.replace('\\', '/')
  if os.path.isdir(path):
    for file in os.listdir(path):
      if serverpath:
        host_statically(f'{path}/{file}', f'{serverpath}/{file}')
      else:
        host_statically(f'{path}/{file}')
    return

  if not serverpath:
    serverpath = f'/{path}'
  application.add_url_rule(serverpath, f'static_{serverpath}', lambda:__static_content_func(path))

def host_redirect(path, serverpath):
  application.add_url_rule(serverpath, f'redirect_{serverpath}', lambda:redirect(path))

### WARNING ###
# This is a very fragile solution to a very tricky problem. Selenium is not multiprocess-safe (not to mention not thread-safe).
# However, it's quite expensive to keep opening up separate chrome instances for each image capture.
# It's also challenging to do cross-process synchronization in flask.
# Fortunately, this flask server is configured to be a single thread -- so it's safe to use threading.Lock() in this SPECIFIC case.
### WARNING ###
driver = None
lock = threading.Lock()
def validate_and_capture_image(solution_json):
  global lock, driver
  acquired = lock.acquire(timeout=600)
  if not acquired:
    # If we timeout while trying to lock, something has gone terribly wrong.
    # In this case, we should remake the driver object (which is probably dead) and the lock.
    driver = None
    lock = threading.Lock()
    # There's no reason (at this point) to capture the actual image, because the caller is long gone.
    return

  try:
    if not driver:
      if not application.debug: # In local testing we use chrome as a frontend, so don't kill it.
        os.system('killall chrome') # Murder any chrome executables
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
  except TimeoutException:
    data = {'error': 'Validation timed out'}
  except JavascriptException as e:
    data = {'error': f'Javascript failure: {e}'}
  finally:
    lock.release()

  return data

def upload_image(img_bytes, display_hash):
  name = display_hash[:2] + '/' + display_hash + '.png'
  if application.debug:
    try:
      os.mkdir(f'images/{display_hash[:2]}')
    except FileExistsError:
      pass
    Image.open(img_bytes).save(f'images/{name}')
    return f'/images/{name}'
  else:
    boto3.client(
      's3',
      aws_access_key_id = secrets.S3_ACCESS_KEY,
      aws_secret_access_key = secrets.S3_SECRET_ACCESS_KEY,
    ).upload_fileobj(img_bytes, 'witnesspuzzles-images', name)
    return f'https://witnesspuzzles-images.s3.amazonaws.com/{name}'
