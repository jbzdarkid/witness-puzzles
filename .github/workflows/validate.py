from pathlib import Path
import json
import os
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
print(data)
data = json.loads(data)
if not data.get('valid', False):
    print('Puzzle was not valid:', data['error'])
    exit(1)
print('Puzzle validated!')

# Extract data from the data (in case we fail, not that we should)
title = data['title']
img_bytes = data['screenshot'][len('data:image/png;base64,'):] # Remove prefix
puzzle_json = data['puzzle_json']
solution_path = data['solution_path'] # TODO: Encrypt

# This is a slightly updated display_hash solution -- rather than hashing the puzzle, I'm just generating a random ID every time.
# (Also, I'm flattening the alphabet ahead of time to avoid letter bias.)
alphabet = ['23456789ABCDEFGHJKLMNPQRSTUVWXYZ']
display_hash = ''.join(itertools.product(alphabet, 8))
image_url = f'images/{display_hash[:2]}/{display_hash}.png'
page_url = f'play/{display_hash}.html'

print('Creating puzzle page...')
with open(image_url, 'wb') as f:
    f.write(img_bytes)

contents = open('.github/workflows/template_play.html', 'r', encoding='utf-8').read()
contents = contents \
    .replace('%title%', title) \
    .replace('%display_hash%', display_hash) \
    .replace('%image_url%', image_url) \
    .replace('%puzzle%', puzzle) \
    .replace('%solution%', solution_path)
with open(page_url, 'w', encoding='utf-8') as f:
    f.write(contents)

with open('puzzle_list.js', 'a', encoding='utf-8') as f:
    contents = f.read().split('\n')
    contents.insert(1, f'{display_hash}{title}')
    f.seek(0)
    f.write('\n'.join(contents))

