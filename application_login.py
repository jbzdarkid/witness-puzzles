import os
from flask import render_template, request
from flask_login import current_user, login_user, logout_user, UserMixin, LoginManager
from flask_wtf import CSRFProtect

from application_utils import *
from application_database import *

if 'RDS_DB_NAME' in os.environ: # Running on AWS
  ADMIN_USERNAME = os.environ['RDS_USERNAME']
  ADMIN_PASSWORD = os.environ['RDS_PASSWORD']
else:
  ADMIN_USERNAME = 'foo'
  ADMIN_PASSWORD = 'bar'

csrf = CSRFProtect()
csrf.init_app(application)

application.login_manager = LoginManager()
@application.login_manager.user_loader
def load_user(user_id):
  user = UserMixin()
  user.id = user_id
  return user

host_redirect('/pages/login.html', '/login.html')
def login():
  if request.method == 'GET':
    logged_in = 'true' if current_user.get_id() == ADMIN_USERNAME else 'false'
    return render_template('login.html', logged_in=logged_in)

  if request.form['username'] == ADMIN_USERNAME and request.form['password'] == ADMIN_PASSWORD:
    user = UserMixin()
    user.id = request.form['username']
    login_user(user)
    print(f'Logged in as {user.id}')
    return redirect('/browse.html')
  return render_template('login.html')
application.add_url_rule('/pages/login.html', 'login', login, methods=['GET', 'POST'])

def logout():
  if current_user.get_id() != None:
    logout_user()
  return redirect(request.args.get('next', 'browse.html'))
application.add_url_rule('/logout', 'logout', logout, methods=['GET'])

def browse_page():
  logged_in = 'true' if current_user.get_id() == ADMIN_USERNAME else 'false'
  return render_template('browse.html', logged_in=logged_in)
application.add_url_rule('/pages/browse.html', 'browse_page', browse_page)

def delete():
  if current_user.get_id() != ADMIN_USERNAME:
    return '', 200
  display_hash = request.form['puzzle']
  print(f'Authenticated as {current_user.id}; deleting puzzle {display_hash}')

  delete_puzzle(display_hash)
  return '', 200
application.add_url_rule('/delete', 'delete', delete, methods=['POST'])

def refresh():
  if current_user.get_id() != ADMIN_USERNAME:
    return '', 200
  display_hash = request.form['puzzle']
  print(f'Authenticated as {current_user.id}; refreshing image for puzzle {display_hash}')

  puzzle = get_puzzle(display_hash)
  if not puzzle:
    return f'Puzzle {display_hash} not found', 400
  valid, data, puzzle_json = validate_and_capture_image(puzzle.solution_json)
  print(f'Re-validated puzzle {display_hash}; valid: {valid}')
  if not valid:
    return data, 400

  new_url = upload_image(data, display_hash)
  print(f'Re-uploaded image for puzzle {display_hash}, at url {new_url} (old url: {puzzle.url})')

  return new_url, 200
application.add_url_rule('/refresh', 'refresh', refresh, methods=['POST'])

def telemetry_page():
  if current_user.get_id() != ADMIN_USERNAME:
    return render_template('404_generic.html'), 404
  return render_template('telemetry.html', feedback=get_all_feedback(), errors=get_all_errors())
application.add_url_rule('/telemetry', 'telemetry', telemetry_page, methods=['GET'])

def delete_telemetry():
  if current_user.get_id() != ADMIN_USERNAME:
    return '', 200
  if request.form['type'] == 'feedback':
    delete_feedback(int(request.form['id']))
  if request.form['type'] == 'error':
    delete_error(int(request.form['id']))
  return '', 200
application.add_url_rule('/delete_telemetry', 'delete_telemetry', delete_telemetry, methods=['POST'])
