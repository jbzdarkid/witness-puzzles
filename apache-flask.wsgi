import os
import sys

# sys.path.append('/var/www/apache-flask/app')
with open('config.txt', 'r') as f:
  for line in f:
    line = line.split('#', 1)[0].strip()
    line = line.split('=', 1)
    if len(line) == 2:
      os.environ[line[0]] = line[1]

from application import application
