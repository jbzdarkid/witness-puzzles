from pathlib import Path
import zipfile
import sys
import hashlib

if len(sys.argv) < 2:
  print('Please specify the release version as the first argument, e.g. ./publish.py 1.21')
  exit(-1)
version = sys.argv[1]

paths = [
  Path('application.py'),
  Path('application_database.py'),
  Path('application_login.py'),
  Path('application_utils.py'),
  Path('data'),
  Path('engine'),
  Path('pages'),
  Path('requirements.txt'),
  Path('requirements'),
  Path('.ebextensions/https-instance.config'),
  Path('install-google-chrome.sh'),
]

all_paths = []
for path in paths:
  if path.is_file():
    all_paths.append(path)
  else:
    all_paths += list(path.glob('**/*'))

# path = path.parent / (path.stem + path.suffix)
# path = path.parent / path.name

replacements = {}
for path in all_paths:
  if path.suffix == '.js':
    hash = hashlib.sha256()
    hash.update(path.read_bytes())
    replacements[path.name] = f'{path.stem}-{hash.hexdigest()[:8]}{path.suffix}'

z = zipfile.ZipFile(f'{version}.zip', 'w')
for path in all_paths:
  arcname = str(path.relative_to(Path(__file__).parent))

  if path.suffix in ['.js', '.html', '.py']:
    with path.open() as f:
      contents = f.read()
    for key in replacements:
      contents = contents.replace(key, replacements[key])
      arcname = arcname.replace(key, replacements[key])
    z.writestr(arcname, contents)
  else:
    z.write(arcname, path)

z.close()

