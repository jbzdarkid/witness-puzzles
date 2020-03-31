from flask import render_template, request
from datetime import datetime
from json import dumps as to_json_string
import os
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
host_statically('pages/validate.html')
host_statically('pages/triangles.html')
host_statically('pages/triangles.js')

if application.debug:
  host_statically('pages/test.html')
  host_statically('pages/test.js')
  host_statically('pages/editor_test.html')
  host_statically('pages/editor_test.js')

  host_statically('pages/_UTM.html')
  host_statically('pages/_UTM.js')
  host_statically('pages/_UTM2.js')

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
  title = request.form['title']

  valid, data = validate_and_capture_image(puzzle_json, solution_json)
  if not valid:
    add_feedback(data)
    return '', 400
  else:
    display_hash = create_puzzle(title, puzzle_json, solution_json, data)
    return display_hash, 200
application.add_url_rule('/publish', 'publish', publish, methods=['POST'])

# Playing published puzzles
def play(display_hash):
  puzzle = get_puzzle(display_hash)
  if not puzzle or not puzzle.puzzle_json:
    return render_template('404_puzzle.html', display_hash=display_hash)

  return render_template('play_template.html',
    puzzle=puzzle.puzzle_json,
    display_hash=display_hash,
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

# Users providing feedback
def feedback():
  add_feedback(request.form['data'])
  return '', 200
application.add_url_rule('/feedback', 'feedback', feedback, methods=['POST'])

# Internal errors
def error():
  add_error(request.form['data'])
  return '', 200
application.add_url_rule('/error', 'error', error, methods=['POST'])

if __name__ == '__main__':
  extra_files = []
  for root, dirs, files in os.walk('.'):
    if 'images' in root:
      continue
    for file in files:
      extra_files.append(root + os.sep + file)
  application.run(extra_files=extra_files)
