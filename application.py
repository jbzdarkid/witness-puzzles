from flask import render_template, request
import os
from json import dumps as to_json_string
from datetime import datetime
from uuid import UUID, uuid4
from traceback import format_exc

from application_database import *
from application_utils import *
import application_hashes

# Home page
host_redirect('/pages/browse.html', '/')
host_redirect('/pages/browse.html', '/index.html')

# Short name redirects
host_redirect('/pages/browse.html', '/browse.html')
host_redirect('/pages/editor.html', '/editor.html')
host_redirect('/pages/test.html', '/test.html')
host_redirect('/pages/editor_test.html', '/editor_test.html')
host_redirect('/pages/validate.html', '/validate.html')
host_redirect('/pages/triangles.html', '/triangles.html')
host_redirect('/pages/triangles.js', '/triangles.js')

# Large blocks of data
host_statically('data')
host_statically('engine')
host_statically('sourcemaps')

# Actual page sources
host_statically('pages/browse.html')
host_statically('pages/browse.js')
host_statically('pages/editor.html')
host_statically('pages/editor.js')
host_statically('pages/test.html', protected=True)
host_statically('pages/test.js', protected=True)
host_statically('pages/editor_test.html', protected=True)
host_statically('pages/editor_test.js', protected=True)
host_statically('pages/validate.html')
host_statically('pages/triangles.html')
host_statically('pages/triangles.js')

def page_not_found(error):
  return render_template('404_generic.html'), 404
application.register_error_handler(404, page_not_found)

def handle_exception(exc):
  message = f'Caught a {type(exc).__name__}: {format_exc()}'
  add_feedback(message)
  return '', 500
application.register_error_handler(Exception, handle_exception)

# Publishing puzzles
def publish():
  puzzle_json = request.form['puzzle']
  solution_json = request.form['solution']

  valid, data = validate_and_capture_image(puzzle_json, solution_json)
  if not valid:
    add_feedback(data)
    return '', 400
  else:
    display_hash = create_puzzle(puzzle_json, solution_json, data)
    return display_hash, 200
application.add_url_rule('/publish', 'publish', publish, methods=['POST'])

# Playing published puzzles
def play(display_hash):
  puzzle = get_puzzle(display_hash)
  if not puzzle or not puzzle.puzzle_json:
    return render_template('404_puzzle.html', display_hash=display_hash)

  session_id = uuid4()
  start_session(session_id)
  return render_template('play_template.html',
    puzzle=puzzle.puzzle_json,
    display_hash=display_hash,
    session_id=session_id,
    title=puzzle.title,
    image=puzzle.url
  )
application.add_url_rule('/play/<display_hash>', 'play', play)

# Getting puzzles from the DB to show on the browse page
def browse():
  sort_type = request.args.get('sort_type', 'date') # date
  order = request.args.get('order', '') # asc, desc
  puzzles = get_puzzles(sort_type, order)

  output = []
  for puzzle in puzzles:
    output.append({
      'display_hash': puzzle.display_hash,
      'url': puzzle.url,
      'title': puzzle.title,
    })
  return to_json_string(output)
application.add_url_rule('/browse', 'browse', browse)

# Users providing feedback or internal bug reports
def feedback():
  add_feedback(request.form['data'])
  return '', 200
application.add_url_rule('/feedback', 'feedback', feedback, methods=['POST'])

# Firing telemetry
def telemetry():
  session_id = UUID(request.form['session_id'])
  type = request.form['type']
  date = None
  if 'date' in request.form:
    date = datetime.fromtimestamp(int(request.form['date']) / 1000)
  add_event(session_id, type, date)

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
    if 'images' in root:
      continue
    for file in files:
      extra_files.append(root + os.sep + file)
  application.run(extra_files=extra_files)
