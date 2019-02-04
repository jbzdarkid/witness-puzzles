from flask import Flask, request, redirect, send_from_directory
import os
from chromedriver_py import binary_path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from PIL import Image
from io import BytesIO
from base64 import b64decode

application = Flask(__name__, template_folder='pages')

def http_to_https():
  if request.is_secure:
    return
  if request.headers.get('X-Forwarded-Proto', '') == 'https':
    return
  return redirect(request.url.replace('http://', 'https://', 1), code=301)

def disable_caching(request):
  request.headers['Cache-Control'] = 'no-cache'
  return request

application.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
if 'RDS_DB_NAME' in os.environ: # Running on AWS
  application.config.update({
    'SQLALCHEMY_DATABASE_URI':'mysql://{user}:{pswd}@{host}:{port}/{name}'.format(
      user = os.environ['RDS_USERNAME'],
      pswd = os.environ['RDS_PASSWORD'],
      host = os.environ['RDS_HOSTNAME'],
      port = os.environ['RDS_PORT'],
      name = os.environ['RDS_DB_NAME'],
    ),
    # Re-use the database username/password with flask-basicauth (used to protect certain pages)
    'USERNAME': os.environ['RDS_USERNAME'],
    'PASSWORD': os.environ['RDS_PASSWORD'],
    'SECRET_KEY': os.environ['SECRET_KEY'],
  })
  application.debug = False
  # Enforce HTTPS only in the presence of a certificate
  application.before_request(http_to_https)
else: # Running locally
  application.config.update({
    'SQLALCHEMY_DATABASE_URI':'sqlite:///:memory:',
    'SECRET_KEY': 'default',
  })
  application.after_request(disable_caching)
  application.debug = True # Required to do auto-reload

def request_is_authorized():
  if 'USERNAME' not in application.config or 'PASSWORD' not in application.config:
    return True # No user/pass specified, allow access
  if not request.authorization:
    return False # No auth provided, block access
  if (application.config['USERNAME'] == request.authorization.username and
      application.config['PASSWORD'] == request.authorization.password):
    return True # Correct user/pass provided, allow access

  return False # Default, block access

def __static_content_func(protected, filename):
  if protected and not request_is_authorized():
    # Contents, HTTP code, headers
    return '', 401, {'WWW-Authenticate': 'Basic realm=""'}

  root, file = filename.rsplit('/', 1)
  return send_from_directory(root, file)

# Recursively host folders, files, with custom paths per request.
def host_statically(path, serverpath=None, protected=False):
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
  application.add_url_rule(serverpath, path, lambda:__static_content_func(protected, path))

def validate_and_capture_image(puzzle_json, solution_json):
  options = webdriver.ChromeOptions()
  options.add_argument('headless')
  driver = webdriver.Chrome(chrome_options=options, executable_path=binary_path)
  driver.get(f'{request.url_root}validate.html')

  # Wait for page to load, then run the script and wait for a response.
  try:
    WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, 'puzzle')))
    driver.execute_script(f'validate_and_capture_image({puzzle_json}, {solution_json})')
    result = WebDriverWait(driver, 60).until(EC.presence_of_element_located((By.ID, 'result')))
  except TimeoutException:
    driver.quit()
    return False

  valid = result.get_attribute('valid')
  if not valid == 'true':
    driver.quit()
    return False

  bytes = result.get_attribute('screenshot')[22:] # Remove the "data:image/png;base64," prefix
  img = Image.open(BytesIO(b64decode(bytes)))
  driver.quit()
  if not os.path.exists(f'images/{display_hash[:2]}'):
    try:
      os.makedirs(f'images/{display_hash[:2]}')
      img.save(f'images/{display_hash[:2]}/{display_hash}.png')
    except OSError as e:
      return False
  return True
