# curl -sSL https://raw.githubusercontent.com/jbzdarkid/witness-puzzles/master/code-deploy.sh | bash

sudo mkdir -p /var/www/apache-flask/
sudo chown -R $USER /var/www/apache-flask/
cd /var/www/apache-flask/
git clone https://github.com/jbzdarkid/witness-puzzles
cd witness-puzzles

# Install all the dependencies
sudo apt-get update
sudo apt-get install -y \
  apache2 \
  # build-essential \
  certbot \
  libapache2-mod-wsgi-py3 \
  # msql-client \
  python3-pip \
  python3-certbot-apache \
  # requests \
  # ruby-full \
  # wget \
  xdg-utils

# Version list at https://www.ubuntuupdates.org/package/google_chrome/stable/main/base/google-chrome-stable
sudo python3 -m pip install chromedriver-py==92.*
CHROME_VERSION=92.0.4515.159-1
wget --no-verbose -O /tmp/chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_${CHROME_VERSION}_amd64.deb
sudo dpkg -i /tmp/chrome.deb
# May need apt --fix-broken install
rm /tmp/chrome.deb
apt-get autoremove

sudo python3 -m pip install -r requirements/prod.txt

# Copy apache configuration, set up apache modules
sudo cp -f witness-puzzles.conf /etc/apache2/sites-available/
sudo a2enmod ssl
sudo a2enmod rewrite
# mod_wsgi is automatically enabled by the pip install
sudo a2ensite witness-puzzles
sudo a2dissite 000-default.conf

# Test configuration & restart apache
apache2ctl configtest
sudo systemctl restart apache2
sudo systemctl status apache2

# Enable SSL (autorenew cronjob is created automatically)
sudo certbot --apache \
  -n --agree-tos -m "jbzdarkid@gmail.com" \
  -d witnesspuzzles.com \
  -d www.witnesspuzzles.com
