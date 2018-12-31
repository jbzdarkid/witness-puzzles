from datetime import datetime, timedelta
from flask_sqlalchemy import SQLAlchemy
from hashlib import sha256
from sqlalchemy_utils import UUIDType

from application_utils import *

db = SQLAlchemy(application)

class Puzzle(db.Model):
  # Language of 32: [0-9A-Z] / I, 1, O, 0
  # 8 characters at 32 = 2^40
  # 50% of collision at 2^20 entries
  display_hash = db.Column(db.String(8), unique=True, primary_key=True)
  data = db.Column(db.Text, nullable=False)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  user_id = db.Column(db.Integer, db.ForeignKey('user.id')) #, nullable=False

def create_puzzle(data):
  h = sha256()
  h.update(data.encode())
  display_hash = h.hexdigest()[:8].upper()
  display_hash = display_hash.replace('I', 'A')
  display_hash = display_hash.replace('O', 'B')
  display_hash = display_hash.replace('1', 'C')
  display_hash = display_hash.replace('0', 'D')
  if not get_puzzle(display_hash):
    puzzle = Puzzle(data=data, display_hash=display_hash)
    db.session.add(puzzle)
    db.session.commit()
  return display_hash

def get_puzzle(display_hash):
  return db.session.query(Puzzle).filter(Puzzle.display_hash == display_hash).first()

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
  event = Event(session_id=session_id, type='session_create')
  db.session.add(event)
  db.session.commit()

def add_event(session_id, type):
  if not is_active(session_id):
    return
  event = Event(session_id=session_id, type=type)
  db.session.add(event)
  db.session.commit()

def is_active(session_id):
  session = db.session.query(Event).filter(Event.session_id == session_id).first()
  if not session:
    return False
  if datetime.utcnow() - session.date > timedelta(hours=1):
    return False
  return True

def get_all_rows():
  data = 'Puzzles:\n'
  puzzles = db.session.query(Puzzle).all()
  for puzzle in puzzles:
    data += f'Puzzle {puzzle.display_hash} created on {puzzle.date} of size {len(puzzle.data)}\n'

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

db.create_all()
