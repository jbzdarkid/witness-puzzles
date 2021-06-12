from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask import request
from hashlib import sha256

from application_utils import *

db = SQLAlchemy(application)

class Puzzle(db.Model):
  # Language of 32: [0-9A-Z] / I, 1, O, 0
  # 8 characters at 32 = 2^40
  # 50% of collision at 2^20 entries
  display_hash = db.Column(db.String(8), unique=True, primary_key=True)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  puzzle_json = db.Column(db.Text, nullable=False)
  solution_json = db.Column(db.Text, nullable=False)
  url = db.Column(db.Text)
  title = db.Column(db.Text)

def create_puzzle(title, puzzle_json, solution_json, img_bytes):
  h = sha256()
  h.update(puzzle_json.encode())
  display_hash = h.hexdigest()[:8].upper()
  display_hash = display_hash.replace('I', 'A')
  display_hash = display_hash.replace('O', 'B')
  display_hash = display_hash.replace('1', 'C')
  display_hash = display_hash.replace('0', 'D')
  puzzle = get_puzzle(display_hash)
  if puzzle:
    return display_hash # Puzzle already exists

  puzzle = Puzzle(
    display_hash=display_hash,
    puzzle_json=puzzle_json,
    solution_json=solution_json,
    url=upload_image(img_bytes, display_hash),
    title=title,
  )
  db.session.add(puzzle)
  db.session.commit()

  return display_hash

def get_puzzle(display_hash):
  return db.session.query(Puzzle).filter(Puzzle.display_hash == display_hash).first()

def get_puzzles(sort_type, order, offset, limit):
  if sort_type == 'date':
    column = Puzzle.date
  else:
    print('Received request for puzzles with unknown sort_type: "' + sort_type + '"')
    return []

  if order == 'desc':
    column = column.desc()

  return db.session.query(Puzzle).order_by(column).offset(offset).limit(limit)

def delete_puzzle(display_hash):
  db.session.query(Puzzle).filter(Puzzle.display_hash == display_hash).delete()
  db.session.commit()

class Feedback(db.Model):
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  page = db.Column(db.Text, nullable=True)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  data = db.Column(db.Text, nullable=True)

def add_feedback(data):
  print(f'Recieved feedback: {data}')
  page = request.environ.get('HTTP_REFERER', '')
  db.session.add(Feedback(page=page, data=data))
  db.session.commit()

def get_all_feedback():
  feedback = []
  for row in db.session.query(Feedback).all():
    # https://stackoverflow.com/a/1960546
    feedback.append({col.name: str(getattr(row, col.name)) for col in row.__table__.columns})
  return feedback

def delete_feedback(id):
  db.session.query(Feedback).filter(Feedback.id == id).delete()
  db.session.commit()

class Error(db.Model):
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  page = db.Column(db.Text, nullable=True)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  data = db.Column(db.Text, nullable=True)

def add_error(data):
  print(f'Recieved error: {data}')
  page = request.environ.get('HTTP_REFERER', '')
  db.session.add(Error(page=page, data=data))
  db.session.commit()

def get_all_errors():
  errors = []
  for row in db.session.query(Error).all():
    # https://stackoverflow.com/a/1960546
    errors.append({col.name: str(getattr(row, col.name)) for col in row.__table__.columns})
  return errors

def delete_error(id):
  db.session.query(Error).filter(Error.id == id).delete()
  db.session.commit()

db.create_all()

if application.debug:
  for i in range(1234):
    db.session.add(Puzzle(
      display_hash = '267BCA' + str(i),
      puzzle_json = '{"grid":[[{"type":"line","start":true}],[{"type":"line"}],[{"type":"line","end":"right"}]],"largezero":6,"width":3,"height":1,"pillar":false,"startPoint":{"x":2,"y":0}}',
      solution_json = '{"grid":[[{"type":"line","line":1,"start":true}],[{"type":"line","line":1}],[{"type":"line","line":1,"end":"right"}]],"largezero":6,"width":3,"height":1,"pillar":false,"startPoint":{"x":2,"y":0}}',
      date = datetime(2001, 1, 1),
      url = '/images/26/267BCA24.png',
      title = 'Puzzle ' + str(i),
    ))
  db.session.add(Feedback(
    page='play_template.html',
    data='hi this is some feedback'
  ))
  db.session.add(Feedback(
    page='browse.html',
    data='hi this is some other feedback'
  ))
  db.session.add(Error(
    page='play_template.html',
    data='error on line 7'
  ))
  db.session.add(Error(
    page='browse.html',
    data='error on line 12'
  ))
  db.session.commit()
