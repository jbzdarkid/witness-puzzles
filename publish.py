from pathlib import Path
import hashlib
import subprocess
import sys
import zipfile

if len(sys.argv) < 2:
  print('Please specify the release version as the first argument, e.g. ./publish.py 1.21')
  exit(-1)
version = sys.argv[1]

subprocess.run(['git', 'fetch', '--tags'], check=True)
output = subprocess.run(['git', 'tag', version])
if output.returncode != 0:
  print(f'Tag {version} already exists. Please choose another one.')
  exit(-2)

paths = [
  Path('application.py'),
  Path('application_database.py'),
  Path('application_login.py'),
  Path('application_utils.py'),
  Path('code-deploy.sh'),
  Path('data'),
  Path('engine'),
  Path('LICENSE.md'),
  Path('pages'),
  Path('README.md'),
  Path('requirements'),
  Path('requirements.txt'),
  Path('robots.txt'),
  Path('witness-puzzles.conf'),
]

all_paths = []
for path in paths:
  if path.is_file():
    all_paths.append(path)
  else:
    all_paths += list(path.glob('**/*'))

# path = path.parent / (path.stem + path.suffix)
# path = path.parent / path.name

replacements = {'%version%': version}
for path in all_paths:
  if path.suffix == '.js':
    hash = hashlib.sha256()
    hash.update(path.read_bytes())
    replacements[path.name] = f'{path.stem}-{hash.hexdigest()[:8]}{path.suffix}'

z = zipfile.ZipFile(f'{version}.zip', 'w')
root = Path(__file__).parent.resolve()
for path in all_paths:
  path = path.resolve()
  arcname = str(path.relative_to(root))

  if path.suffix in ['.js', '.html', '.py']:
    with path.open() as f:
      contents = f.read()
    for key in replacements:
      contents = contents.replace(key, replacements[key])
      arcname = arcname.replace(key, replacements[key])
    z.writestr(arcname, contents)
  else:
    z.write(path, arcname)

z.close()

subprocess.run(['git', 'push', 'origin', version], check=True)
