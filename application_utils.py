from flask import Flask, request, redirect, send_from_directory
import os
from json import dumps as to_json_string
from chromedriver_py import binary_path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from PIL import Image
from io import BytesIO
from base64 import b64decode
import boto3

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
    'S3_ACCESS_KEY': os.environ['S3_ACCESS_KEY'],
    'S3_SECRET_ACCESS_KEY': os.environ['S3_SECRET_ACCESS_KEY'],
    'SECRET_KEY': os.environ['SECRET_KEY'], # CSRF secret key
  })
  # Enforce HTTPS only in the presence of a certificate
  # TODO: Finish setting up HTTPS
  # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/https-singleinstance.html
  # https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/https-singleinstance-python.html
  # application.before_request(http_to_https)
  application.debug = False
else: # Running locally
  application.config.update({
    'SQLALCHEMY_DATABASE_URI':'sqlite:///:memory:',
    'SECRET_KEY': 'default',
  })
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

def validate_and_capture_image(puzzle_json, solution_json):
  options = webdriver.ChromeOptions()
  options.add_argument('headless')
  driver = webdriver.Chrome(chrome_options=options, executable_path=binary_path)
  driver.get(f'{request.url_root}validate.html')

  valid = False
  try:
    # Wait for page to load, then run the script and wait for a response.
    WebDriverWait(driver, 5).until(EC.presence_of_element_located((By.ID, 'puzzle')))
    driver.execute_script(f'validate_and_capture_image({to_json_string(puzzle_json)}, {to_json_string(solution_json)})')
    result = WebDriverWait(driver, 60).until(EC.presence_of_element_located((By.ID, 'result')))
    if result.get_attribute('valid') == 'true':
      # [22:] to remove the "data:image/png;base64," prefix
      data = BytesIO(b64decode(result.get_attribute('screenshot')[22:]))
      valid = True
    else:
      data = 'Validation failed.\n'
  except TimeoutException:
    data = 'Validation timed out.\n'

  if not valid:
    data += 'Console output:\n'
    for line in driver.get_log('browser'):
      data += f'{line["level"]}: {line["message"]}\n'

  driver.quit()
  return valid, data

def upload_image(img_bytes, display_hash):
  name = display_hash[:2] + '/' + display_hash + '.png'
  if application.debug:
    try:
      os.mkdir(f'images/{display_hash[:2]}')
    except FileExistsError:
      pass
    Image.open(img_bytes).save(f'images/{name}')
    return f'images/{name}'
  else:
    boto3.client(
      's3',
      aws_access_key_id = application.config['S3_ACCESS_KEY'],
      aws_secret_access_key = application.config['S3_SECRET_ACCESS_KEY'],
    ).upload_fileobj(img_bytes, 'witnesspuzzles-images', name)
    return f'https://witnesspuzzles-images.s3.amazonaws.com/{name}'
