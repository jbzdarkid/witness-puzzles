from datetime import datetime, timedelta
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

class Feedback(db.Model):
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  page = db.Column(db.Text, nullable=True)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  data = db.Column(db.Text, nullable=True)

def add_feedback(data):
  print(f'Recieved feedback: {data}')
  page = request.environ.get('HTTP_REFERRER', '')
  db.session.add(Feedback(page=page, data=data))
  db.session.commit()

class Error(db.Model):
  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  page = db.Column(db.Text, nullable=True)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  data = db.Column(db.Text, nullable=True)

def add_error(data):
  print(f'Recieved error: {data}')
  page = request.environ.get('HTTP_REFERRER', '')
  db.session.add(Error(page=page, data=data))
  db.session.commit()

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
