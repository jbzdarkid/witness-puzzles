from flask import send_from_directory, redirect, render_template, request, Response
import os
from application_database import *
from uuid import UUID, uuid4

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

# Root should be some sort of puzzle browser, not old index.html
# application.add_url_rule('/', 'root', lambda:send_from_directory('', 'index.html'))

host_statically('data')
host_statically('engine')
host_statically('pages/editor.html', '/editor.html')
host_statically('pages/editor.js', '/editor.js')
host_statically('pages/test.html', '/test.html', protected=True)
host_statically('pages/test.js', '/test.js', protected=True)

@application.errorhandler(404)
def page_not_found(error):
  return render_template('404_generic.html'), 404

# Publishing puzzles
def publish():
  data = request.form['publishData']
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
def telemetry():
  session_id = UUID(request.form['session_id'])
  type = request.form['type']
  add_event(session_id, type)

  return '', 200
application.add_url_rule('/telemetry', 'telemetry', telemetry, methods=['POST'])

# Viewing telemetry
def dashboard():
  if not request_is_authorized():
    return '', 401, {'WWW-Authenticate': 'Basic realm=""'}
  rows = get_all_rows()
  return render_template('dashboard_template.html', data=rows)
application.add_url_rule('/dashboard.html', 'dashboard.html', dashboard)

if __name__ == '__main__':
  extra_files = []
  for root, dirs, files in os.walk('.'):
    for file in files:
      extra_files.append(root + os.sep + file)
  application.run(extra_files=extra_files)
