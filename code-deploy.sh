#!/bin/bash
# First, clone & run this script
# mkdir -p /var/www/apache-flask/
# cd /var/www/apache-flask/
# git clone https://github.com/jbzdarkid/witness-puzzles
# chown -R $USER witness-puzzles
# cd witness-puzzles
# chmod u+x code-deploy.sh
# ./code-deploy.sh
set -e

# Install all the dependencies
apt-get update
apt-get install -y \
  apache2 \
  build-essential \
  certbot \
  libapache2-mod-wsgi-py3 \
  msql-client \
  python3-pip \
  python3-venv \
  requests \
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

# Add in python3-certbot-apache
python3 -m pip install -r "$REPO/requirements.txt"

# Set up and enable flask
cp -f "$REPO/docker/apache-flask.conf" /etc/apache2/sites-available/
a2ensite apache-flask
# a2enmod headers
a2dissite 000-default.conf

# Test configuration & restart apache if it passes
apache2ctl configtest
systemctl restart apache2
systemctl status apache2

certbot --apache \
  -n --agree-tos -m "jbzdarkid@gmail.com" \
  -d witnesspuzzles.com \
  -d www.witnesspuzzles.com  
