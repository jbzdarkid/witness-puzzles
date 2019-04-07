from flask import redirect, render_template, request
import os
from uuid import UUID, uuid4

from application_database import *
from application_utils import *
import application_hashes

host_redirect('/pages/editor.html', '/editor.html')
host_redirect('/pages/browse.html', '/index.html')
host_redirect('/pages/browse.html', '/')
host_redirect('/pages/test.html', '/test.html')
host_redirect('/pages/validate.html', '/validate.html')
host_statically('data')
host_statically('engine')
host_statically('images')
host_statically('sourcemaps')
host_statically('pages/browse.html')
host_statically('pages/browse.js')
host_statically('pages/editor.html')
host_statically('pages/editor.js')
host_statically('pages/test.html', protected=True)
host_statically('pages/test.js', protected=True)
host_statically('pages/validate.html')

@application.errorhandler(404)
def page_not_found(error):
  return render_template('404_generic.html'), 404

# Publishing puzzles
def publish():
  puzzle_json = request.form['puzzle']
  solution_json = request.form['solution']

  img_bytes = validate_and_capture_image(puzzle_json, solution_json)
  if img_bytes is None:
    return 400

  display_hash = create_puzzle(puzzle_json, solution_json, img_bytes)

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
    if 'images' in root:
      continue
    for file in files:
      extra_files.append(root + os.sep + file)
  application.run(extra_files=extra_files)
