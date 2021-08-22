# Reinstall requirements (they may have changed!)
cd /var/www/apache-flask/app/
source ./venv/scripts/activate
python3 -m pip install -r requirements.txt

# Set up Apache
cp -f docker/apache-flask.conf /etc/apache2/sites-available/
cp -f docker/apache-flask.wsgi /var/www/apache-flask/app
a2ensite apache-flask
a2enmod headers
a2dissite 000-default.conf

cd /var/www/apache-flask/app
/usr/sbin/apache2ctl -D FOREGROUND
