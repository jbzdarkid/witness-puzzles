from pathlib import Path
from time import sleep
import json
import os
import requests
import subprocess


print('Loading puzzle submission...')
api = f'https://api.github.com/repos/{os.environ["GITHUB_REPOSITORY"]}'

issue = 9 # os.environ.get('ISSUE_ID')
headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': 'Bearer ' + os.environ['GITHUB_TOKEN'],
    'User-Agent': 'Witness Puzzles/3.0 (https://github.com/jbzdarkid/witness-puzzles)',
}
j = requests.get(f'{api}/issues/{issue}', headers=headers).json()

if not any([label['name'] == 'new puzzle' for label in j['labels']]):
    print('This issue was not a puzzle request.')
    exit()

print('Starting automation...')
with open('play_template.html', 'r', encoding='utf-8') as f:
    contents = f.read()

tempfile = Path('temp.html')
with tempfile.open('w', encoding='utf-8') as f:
    f.write(contents.replace('%puzzle%', j['body'])) # Let javascript do the object load; we'll be happy with whatever.

# Do automation stuff here
print('Installing chrome...')
chrome_version = '110.0.5481.177-1'
subprocess.run([
  'wget',
  '--no-verbose',
  '-O', '/tmp/chrome.deb',
  f'https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_{chrome_version}_amd64.deb',
], check=True)
subprocess.run(['sudo', 'dpkg', '-i', '/tmp/chrome.deb'], check=True)
subprocess.run(['sudo', 'apt', '--fix-broken', 'install', '-y'], check=True)

print('Verifying puzzle...')
p = subprocess.Popen(
    ['google-chrome-stable', str(tempfile)],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    encoding='utf-8',
    timeout=60,
    bufsize=0,
)
while 1:
    retcode = p.poll()
    if retcode:
        break
    line = p.stdout.readline()
    print(line)



"""
h = sha256()
h.update(puzzle_json.encode())
display_hash = h.hexdigest()[:8].upper()
display_hash = display_hash.replace('I', 'A')
display_hash = display_hash.replace('O', 'B')
display_hash = display_hash.replace('1', 'C')
display_hash = display_hash.replace('0', 'D')
puzzle = get_puzzle(display_hash)

contents = contents
    .replace('%title%', puzzle.name)
    .replace('%display_hash%', puzzle.display_hash)
    .replace('%solution%', puzzle.display_hash)
    .replace('%puzzle%', puzzle.display_hash)
    .replace('%image%', puzzle.display_hash)
"""





















