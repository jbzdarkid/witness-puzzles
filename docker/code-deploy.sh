# First, clone & download this script
# git clone https://github.com/jbzdarkid/witness-puzzles
# chmod u+x ./witness-puzzles/docker/code-deploy.sh
# sudo ./witness-puzzles/docker/code-deploy.sh

REPO="/home/ubuntu/witness-puzzles" # Step 1 is actually to *move ourself* into the folder.
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

# if [ ! -d "venv" ]; then
#   python3 -m venv venv
# fi
# 
# source ./venv/bin/activate
python3 -m pip install -r "$REPO/requirements.txt"

# Move files into place
cp -rf "$REPO/." .
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

# Add secret environment variables into /etc/apache2/envvars
# Or, I could put them in apache-flask.wsgi, using os.environ['FOO'] = 'BAR'.
# Actually, I think that's the better long-term solution, since then I can ship a config file alongside the git repo. And import it just... using python.
