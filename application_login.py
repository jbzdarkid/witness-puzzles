from flask import render_template, request
from flask_login import current_user, login_required, login_user, UserMixin, LoginManager
import os
from application_utils import *
from application_database import *

if 'RDS_DB_NAME' in os.environ: # Running on AWS
  ADMIN_USERNAME = os.environ['RDS_USERNAME']
  ADMIN_PASSWORD = os.environ['RDS_PASSWORD']
else:
  ADMIN_USERNAME = 'foo'
  ADMIN_PASSWORD = 'bar'

application.login_manager = LoginManager()
@application.login_manager.user_loader
def load_user(user_id):
  user = UserMixin()
  user.id = user_id
  return user

host_redirect('/pages/login_admin.html', '/login_admin.html')
def login_admin():
  if request.method == 'GET':
    return render_template('login_admin.html')

  if request.form['username'] == ADMIN_USERNAME and request.form['password'] == ADMIN_PASSWORD:
    user = UserMixin()
    user.id = request.form['username']
    login_user(user)
    print(f'Logged in as {user.id}')
    return redirect('/browse_admin.html')
  return render_template('login_admin.html')
application.add_url_rule('/pages/login_admin.html', 'login_admin', login_admin, methods=['GET', 'POST'])

host_redirect('/pages/browse_admin.html', '/browse_admin.html')
def browse_admin():
  if current_user.get_id() != ADMIN_USERNAME:
    return render_template('404_generic.html')
  return render_template('browse_admin.html')
application.add_url_rule('/pages/browse_admin.html', 'browse_admin', browse_admin)

def delete():
  if current_user.get_id() != ADMIN_USERNAME:
    return '', 200
  print(f'Authenticated as {current_user.id}; deleting puzzle {request.form["puzzle"]}')

  delete_puzzle(request.form["puzzle"])
  return '', 200
application.add_url_rule('/delete', 'delete', delete, methods=['POST'])

def refresh():
  if current_user.get_id() != ADMIN_USERNAME:
    return '', 200
  display_hash = request.form["puzzle"]
  print(f'Authenticated as {current_user.id}; refreshing image for puzzle {display_hash}')

  puzzle = get_puzzle(display_hash)
  if not puzzle:
    return f'Puzzle {display_hash} not found', 400
  valid, data = validate_and_capture_image(puzzle.puzzle_json, puzzle.solution_json)
  if not valid:
    return data, 400

  upload_image(data, display_hash)
  return '', 200
application.add_url_rule('/refresh', 'refresh', refresh, methods=['POST'])
