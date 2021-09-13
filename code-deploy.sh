# First, clone & download this script
# git clone https://github.com/jbzdarkid/witness-puzzles
# chmod u+x ./witness-puzzles/docker/code-deploy.sh
# sudo ./witness-puzzles/docker/code-deploy.sh

# Step 1 is actually to *move ourself* into the folder.
# In fact, I think the long term plan is to move ourselves into /var/ww/apache-flask/witness-puzzes
REPO="/home/ubuntu/witness-puzzles"
# Move files into place
mkdir -p /var/www/apache-flask/
REPO=$(git rev-parse --show-toplevel)
mv -rf "$REPO" /var/www/apache-flask/
chown $USER witness-puzzles

apt-get update
apt-get install -y \
  apache2 \
  build-essential \
  libapache2-mod-wsgi-py3 \
  msql-client \
  python3-pip \
  python3-venv \
  ruby-full \
  vim \
  wget \
  xdg-utils

# Version list at https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-stable
### THIS MUST MATCH THE chromedriver-py MAJOR VERSION! ###
CHROME_VERSION=92.0.4515.159-1
wget --no-verbose -O /tmp/chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}_amd64.deb
dpkg -i /tmp/chrome.deb
apt-get autoremove

# if [ ! -d "venv" ]; then
#   python3 -m venv venv
# fi
# 
# source ./venv/bin/activate
python3 -m pip install -r "$REPO/requirements.txt"

cp -f "$REPO/docker/apache-flask.conf" /etc/apache2/sites-available/
cp -f "$REPO/docker/apache-flask.wsgi" /var/www/apache-flask/app

# Enable the site
a2ensite apache-flask
# a2enmod headers
a2dissite 000-default.conf

# Test & restart apache
apache2ctl configtest
systemctl restart apache2
systemctl status apache2

# Actually, I think that's the better long-term solution, since then I can ship a config file alongside the git repo. And import it just... using python.
