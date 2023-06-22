# curl -sSL https://raw.githubusercontent.com/jbzdarkid/witness-puzzles/master/code-deploy.sh | bash

sudo mkdir -p /var/www/apache-flask/
sudo chown -R $USER /var/www/apache-flask/
cd /var/www/apache-flask/

git clone https://github.com/jbzdarkid/witness-puzzles
# Alternately, scp -i privatekey.pem 5.29.zip user@witnesspuzzles.com:/var/www/apache-flask/witness-puzzles/

cd witness-puzzles

# Install all the dependencies
sudo apt-get update
sudo apt-get install -y \
  apache2 \
  certbot \
  libapache2-mod-wsgi-py3 \
  libmysqlclient-dev \
  mysql-client \
  python3-pip \
  python3-certbot-apache \
  xdg-utils

if python3 --version | grep -vq 'Python 3.8.'
  then echo "Incorrect python version: $(python3 --version)"
fi

# Version list at https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-stable
sudo python3 -m pip install chromedriver-py==110.*
CHROME_VERSION=110.0.5481.177-1
wget --no-verbose -O /tmp/chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}_amd64.deb
sudo dpkg -i /tmp/chrome.deb
sudo apt --fix-broken install -y
rm /tmp/chrome.deb
sudo apt-get autoremove

if google-chrome-stable -version | grep -vq ${CHROME_VERSION:0:-2}
  then echo "Incorrect chrome version: $(google-chrome-stable -version)"
fi

sudo python3 -m pip install -r requirements/prod.txt

# Here is where you should set up environment secrets.

# Copy apache configuration, set up apache modules
sudo cp -f witness-puzzles.conf /etc/apache2/sites-available/
sudo a2enmod ssl
sudo a2enmod rewrite
# mod_wsgi is automatically enabled by the pip install
sudo a2ensite witness-puzzles
sudo a2dissite 000-default.conf

# Test configuration & restart apache
sudo apache2ctl configtest
sudo systemctl restart apache2
sudo systemctl status apache2

# Enable SSL (autorenew cronjob is created automatically)
sudo certbot --apache \
  -n --agree-tos -m "jbzdarkid@gmail.com" \
  -d witnesspuzzles.com \
  -d www.witnesspuzzles.com
