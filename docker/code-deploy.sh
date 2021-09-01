# First, clone & download this script
# git clone https://github.com/jbzdarkid/witness-puzzles
# chmod u+x ./witness-puzzles/docker/code-deploy.sh
# sudo ./witness-puzzles/docker/code-deploy.sh

REPO="/home/ubuntu/witness-puzzles" # ... somehow
mkdir -p /var/www/apache-flask/app/
cd /var/www/apache-flask/app/

apt-get update
apt-get install -y \
  apache2 \
  build-essential \
  libapache2-mod-wsgi-py3 \
  python3-pip \
  python3-venv \
  ruby-full \
  vim \
  wget
apt-get autoremove

if [ ! -d "venv" ]; then
  python3 -m venv venv
fi

source ./venv/bin/activate
python3 -m pip install -r "$REPO/requirements.txt"

# Set up Apache
cp -rf "$REPO/." .
cp -f "$REPO/docker/apache-flask.conf" /etc/apache2/sites-available/
cp -f "$REPO/docker/apache-flask.wsgi" /var/www/apache-flask/app
a2ensite apache-flask
a2enmod headers
a2dissite 000-default.conf
systemctl restart apache2

/usr/sbin/apache2ctl -D FOREGROUND
