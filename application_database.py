from flask import Flask
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy_utils import UUIDType
from os import environ
from uuid import uuid4
from hashlib import sha256

application = Flask(__name__, template_folder='pages')

if 'RDS_DB_NAME' in environ:
  application.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://{user}:{pswd}@{host}:{port}/{name}'.format(
    user = environ['RDS_USERNAME'],
    pswd = environ['RDS_PASSWORD'],
    host = environ['RDS_HOSTNAME'],
    port = environ['RDS_PORT'],
    name = environ['RDS_DB_NAME'],
  )
# Secret key will be empty for local development (which is OK, there's no CSRF risk locally.)
application.config['SECRET_KEY'] = environ['SECRET_KEY'] if 'SECRET_KEY' in environ else 'default'
db = SQLAlchemy(application)

class Puzzle(db.Model):
  __tablename__ = 'puzzles'

  id = db.Column(db.Integer, primary_key=True, autoincrement=True)
  # Language of 32: [0-9A-Z] / I, 1, O, 0,
  # 8 characters at 32 = 2^40
  # 50% of collision at 2^20 entries
  display_hash = db.Column(db.String(8), unique=True)
  data = db.Column(db.Text, nullable=False)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  user_id = db.Column(db.Integer, db.ForeignKey('users.id')) #, nullable=False

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
  __tablename__ = 'users'

  id = db.Column(db.Integer, primary_key=True)
  disp_name = db.Column(db.String(80), nullable=False)
  # google_id
  # faceb_id
  # apple_id
  # msft_id

class Event(db.Model):
  __tablename__ = 'telemetry'
  session_id = db.Column(UUIDType, nullable=False, primary_key=True)
  date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
  type = db.Column(db.String(32), nullable=False)

def new_session():
  uuid = uuid4()
  event = Event(session_id=uuid, type='session_create')
  db.session.add(event)
  db.session.commit()
  return uuid

db.create_all()
