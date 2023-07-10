from pyvirtualdisplay import Display
from pathlib import Path
import os
import subprocess

#display = Display(visible=0, size=(800, 800))  
#display.start()

contents = open('.github/workflows/template_validate.html', 'r', encoding='utf-8').read()
puzzle = os.environ['PUZZLE']
contents = contents.replace('%solution_json%', puzzle) # Let javascript do the object load; we'll be happy with whatever.

tempfile = Path('temp.html').resolve()
with tempfile.open('w', encoding='utf-8') as f:
    f.write(contents)

args = ['google-chrome-stable', tempfile.as_uri(), '--window=size=1200,1200', '--headless=new', '--dump-dom']
dom = subprocess.run(args, text=True, encoding='utf-8', stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, check=True)

start = dom.index('src="data:image/svg+xml;base64,') + len('src="data:image/svg+xml;base64,')
end   = dom.index('">\n', start)
img_data = dom[start:end]
print(img_data)

# TODO: Generate files...
