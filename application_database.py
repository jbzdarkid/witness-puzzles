from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from flask import request
from hashlib import sha256
from sqlalchemy_utils import UUIDType
from json import loads

from application_utils import *

db = SQLAlchemy(application)

class Puzzle(db.Model):
  # Language of 32: [0-9A-Z] / I, 1, O, 0
  # 8 characters at 32 = 2^40
  # 50% of collision at 2^20 entries
  display_hash = db.Column(db.String(8), unique=True, primary_key=True)
  puzzle_json = db.Column(db.Text, nullable=False)
  solution_json = db.Column(db.Text, nullable=False)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  url = db.Column(db.Text)
  title = db.Column(db.Text)
  user_id = db.Column(db.Integer, db.ForeignKey('user.id')) #, nullable=False

def create_puzzle(puzzle_json, solution_json, img_bytes):
  h = sha256()
  h.update(puzzle_json.encode())
  display_hash = h.hexdigest()[:8].upper()
  display_hash = display_hash.replace('I', 'A')
  display_hash = display_hash.replace('O', 'B')
  display_hash = display_hash.replace('1', 'C')
  display_hash = display_hash.replace('0', 'D')
  puzzle = get_puzzle(display_hash)
  if not puzzle:
    puzzle = Puzzle(
      display_hash=display_hash,
      puzzle_json=puzzle_json,
      solution_json=solution_json,
    )
  if not puzzle.url:
    puzzle.url = upload_image(img_bytes, display_hash)
  if not puzzle.title:
    puzzle.title = loads(puzzle.puzzle_json)['name']
  db.session.add(puzzle)
  db.session.commit()

  return display_hash

def get_puzzle(display_hash):
  return db.session.query(Puzzle).filter(Puzzle.display_hash == display_hash).first()

def get_puzzles(sort_type, order, offset=0, limit=100):
  # @Feature: query.offset() and query.limit()
  if sort_type == 'date':
    column = Puzzle.date
  else:
    print('Recieved request for puzzles with unknown sort_type: "' + sort_type + '"')
    return []

  if order == 'desc':
    column = column.desc()

  return db.session.query(Puzzle).order_by(column)

def delete_puzzle(display_hash):
  db.session.query(Puzzle).filter(Puzzle.display_hash == display_hash).delete()

class User(db.Model):
  id = db.Column(db.Integer, primary_key=True)
  disp_name = db.Column(db.String(80), nullable=False)
  # google_id
  # faceb_id
  # apple_id
  # msft_id

class Event(db.Model):
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  session_id = db.Column(UUIDType, nullable=False)
  display_hash = db.Column(db.String(8), db.ForeignKey('puzzle.display_hash'))
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  type = db.Column(db.String(32), nullable=False)

def start_session(session_id):
  db.session.add(Event(
    session_id = session_id,
    type = 'session_create',
    date = datetime.utcnow(),
  ))
  db.session.commit()

def add_event(session_id, type, date):
  if not is_active(session_id):
    return
  db.session.add(Event(session_id=session_id, type=type, date=date))
  db.session.commit()

def is_active(session_id):
  session = db.session.query(Event).filter(Event.session_id == session_id).first()
  if not session:
    return False
  if datetime.utcnow() - session.date > timedelta(hours=1):
    return False
  return True

class Feedback(db.Model):
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  page = db.Column(db.Text, nullable=False)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  data = db.Column(db.Text, nullable=False)

def add_feedback(data):
  print(f'Recieved feedback: {data}')
  db.session.add(Feedback(page=request.environ['HTTP_REFERER'], data=data))
  db.session.commit()

class Error(db.Model):
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  page = db.Column(db.Text, nullable=False)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  data = db.Column(db.Text, nullable=False)

def add_error(data):
  print(f'Recieved error: {data}')
  db.session.add(Error(page=request.environ['HTTP_REFERER'], data=data))
  db.session.commit()

# @Cleanup: This is the model, it should not be processing data. Leave that for the view / controller.
def get_all_rows():
  data = 'Puzzles:\n'
  puzzles = db.session.query(Puzzle).all()
  for puzzle in puzzles:
    data += f'Puzzle {puzzle.display_hash} created on {puzzle.date} of size {len(puzzle.puzzle_json)}\n'

  #for user in users:
  #    print user.name

  data += 'Events:\n'
  sessions = db.session.query(Event).filter(Event.type == 'session_create').all()
  for session in sessions:
    data += '\nSession ' + str(session.session_id) + ':\n'
    events = db.session.query(Event).filter(Event.session_id == session.session_id).all()
    for event in events:
      data += f'Event "{event.type}" at time {event.date}\n'

  return data

# @Cleanup: Only debug mode?
db.create_all()

if application.debug:
  db.session.add(Puzzle(
    display_hash = '2D99CC28',
    puzzle_json = '{}',
    solution_json = '{}',
    date = datetime(2001, 1, 1),
    url = '/images/2D/2D99CC28.png',
    title = 'foo',
  ))
  db.session.add(Puzzle(
    display_hash = 'EB678CA3',
    puzzle_json = '{}',
    solution_json = '{}',
    date = datetime(2002, 2, 2),
    url = '/images/EB/EB678CA3.png',
    title = 'bar',
  ))
  db.session.add(Puzzle(
    display_hash = 'F23DF4F6',
    puzzle_json = '{}',
    solution_json = '{}',
    date = datetime(2003, 3, 3),
    url = '/images/F2/F23DF4F6.png',
    title = 'baz',
  ))
  db.session.commit()
