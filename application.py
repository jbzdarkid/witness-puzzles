from flask import send_from_directory, redirect, render_template
from flask_wtf import FlaskForm
import os
from wtforms import StringField
from application_database import *
from uuid import UUID, uuid4

def __static_content_func(filename):
  root, file = filename.rsplit('/', 1)
  return lambda:send_from_directory(root, file)

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
  application.add_url_rule(serverpath, path, __static_content_func(path))

# Root should be some sort of puzzle browser, not old index.html
# application.add_url_rule('/', 'root', lambda:send_from_directory('', 'index.html'))

host_statically('data')
host_statically('engine')
host_statically('pages/editor.html', '/editor.html')
host_statically('pages/editor.js', '/editor.js')

@application.errorhandler(404)
def page_not_found(error):
  return render_template('404_generic.html'), 404

# Publishing puzzles
class PublishForm(FlaskForm):
  publishData = StringField('publishData')

def publish():
  data = PublishForm().publishData.data
  display_hash = create_puzzle(data)
  return redirect(f'/play/{display_hash}')
application.add_url_rule('/publish', 'publish', publish, methods=['POST'])

# Playing published puzzles
def play(display_hash):
  puzzle = get_puzzle(display_hash)
  if not puzzle or not puzzle.data:
    return render_template('404_puzzle.html', display_hash=display_hash)

  session_id = uuid4()
  start_session(session_id)
  return render_template('play_template.html', puzzle=puzzle.data, display_hash=display_hash, session_id=session_id)
application.add_url_rule('/play/<display_hash>', 'play', play)

# Firing telemetry
class TelemetryForm(FlaskForm):
  session_id = StringField('session_id')
  type = StringField('type')

def telemetry():
  telemetry_form = TelemetryForm()
  session_id = telemetry_form.session_id.data
  type = telemetry_form.type.data
  add_event(UUID(session_id), type)

  return '', 200
application.add_url_rule('/telemetry', 'telemetry', telemetry, methods=['POST'])

# Viewing telemetry
"""
def dashboard():
  rows = get_all_rows()
  return render_template('dashboard_template.html', data=rows)
application.add_url_rule('/dashboard.html', 'dashboard.html', dashboard)
"""

if __name__ == '__main__':
  # Setting debug to True enables debug output. This line should be
  # removed before deploying a production app.
  application.debug = False # Required to do auto-reload
  extra_files = []
  for root, dirs, files in os.walk('.'):
    for file in files:
      extra_files.append(root + os.sep + file)
  application.run(extra_files=extra_files)
