from pathlib import Path
import base64
import json
import os
import random
import subprocess

print('Validating puzzle...')
contents = open('.github/workflows/template_validate.html', 'r', encoding='utf-8').read()
puzzle = os.environ['PUZZLE']
contents = contents.replace('%input_data%', puzzle) # Let javascript do the object load; we'll be happy with whatever.

tempfile = Path('temp.html').resolve()
with tempfile.open('w', encoding='utf-8') as f:
    f.write(contents)

args = ['google-chrome-stable', tempfile.as_uri(), '--headless=new', '--dump-dom']
dom = subprocess.run(args, text=True, encoding='utf-8', stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True).stdout

data = dom[dom.index('!!!')+3:dom.index('@@@')]
data = json.loads(data)
if not data.get('valid', False):
    print('Puzzle was not valid:', data['error'])
    exit(1)
print('Puzzle validated!')

# Extract data from the data (in case we fail, not that we should)
title = data['title']
img_bytes = base64.b64decode(data['screenshot'][len('data:image/png;base64,'):])
puzzle_json = data['puzzle_json']
solution_path = data['solution_path'] # TODO: Encrypt?

# This is a slightly updated display_hash solution -- rather than hashing the puzzle, I'm just generating a random ID every time.
# (Also, I'm flattening the alphabet ahead of time to avoid letter bias.)
alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' # Everything but 0, O, 1, I
display_hash = ''.join(random.choices(alphabet, k=8))
image_url = Path(f'images/{display_hash[:2]}/{display_hash}.png')
image_url.parent.mkdir(parents=True, exist_ok=True)
page_url = Path(f'play/{display_hash}.html')
page_url.parent.mkdir(parents=True, exist_ok=True)

print('Creating puzzle page...')
with image_url.open('x+b') as f:
    f.write(img_bytes)

contents = open('.github/workflows/template_play.html', 'r', encoding='utf-8').read()
contents = contents \
    .replace('%title%', title) \
    .replace('%display_hash%', display_hash) \
    .replace('%image_url%', image_url) \
    .replace('%puzzle%', puzzle) \
    .replace('%solution%', solution_path)
with page_url.open('x+', encoding='utf-8') as f:
    f.write(contents)

with open('puzzle_list.js', 'a+', encoding='utf-8') as f:
    contents = f.read().split('\n')
    contents.insert(1, f'{display_hash}{title}')
    f.seek(0)
    f.write('\n'.join(contents))

