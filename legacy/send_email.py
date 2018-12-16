from base64 import b64encode
from Crypto.Cipher import AES
from Crypto.Hash import SHA256
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from os import getcwd, environ, remove
from selenium.webdriver import Chrome
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from selenium.common.exceptions import TimeoutException
from smtplib import SMTP
from PIL import Image

driver = Chrome()
driver.set_window_size(2000, 2000)
driver.get('file://'+getcwd()+'/witness/index.html')
for line in driver.get_log('browser'):
	print line

condition = EC.presence_of_element_located((By.ID, 'puzzle'))
while 1:
	try:
		WebDriverWait(driver, 10).until(condition)
	except TimeoutException:
		continue
	break

puzzle = driver.find_element_by_tag_name('table')
url = driver.current_url
url = url.replace('file:///home/runner/', 'http://')
rect = (
	puzzle.location['x'],
	puzzle.location['y'],
	puzzle.location['x']+puzzle.size['width'],
	puzzle.location['y']+puzzle.size['height']
)
driver.save_screenshot('temp.png')
driver.quit()
img = Image.open('temp.png')
img = img.crop(rect)
img.save('temp2.png')

sha = SHA256.new()
sha.update(environ['PASSWORD'])
key = sha.hexdigest()[:AES.block_size*2]
text = open('witness/emails.txt', 'rb').read()
iv = text[:AES.block_size]
cipher = text[AES.block_size:]
aes = AES.new(key, AES.MODE_CBC, iv)
plain = aes.decrypt(cipher).strip()

FROM = 'random.witness.puzzles@gmail.com'
DATE = datetime.today().strftime('%A, %B %d, %Y')
server = SMTP('smtp.gmail.com', 587)
server.ehlo()
server.starttls()
server.login(FROM, environ['PASSWORD'])

puzzle_id = 1 # FIXME
body = '''
<a href="%s" style="text-decoration: none">
  <img src="cid:puzzle">
</a>
''' % url

for TO in plain.split(','):
	msg = MIMEMultipart('multipart')
	msg['Subject'] = 'Witness puzzle for %s' % DATE
	msg['To'] = '%s <%s>' % (TO.split('@')[0], TO)
	msg['From'] = FROM
	msg['Date'] = DATE
	msg.attach(MIMEText(body, 'html'))
	img = MIMEImage(open('temp2.png', 'rb').read())
	img.add_header('Content-ID', '<puzzle>')
	msg.attach(img)
	server.sendmail(FROM, TO, msg.as_string())
server.quit()
