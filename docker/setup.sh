# https://docs.aws.amazon.com/codedeploy/latest/userguide/tutorials-github.html
sudo apt-get update
sudo apt-get install -y \
  apache2 \
  build-essential \
  libapache2-mod-wsgi-py3 \
  python3-pip \
  ruby-full \
  vim \
  wget
sudo apt-get autoremove

# Install the CodeDeploy agent: https://docs.aws.amazon.com/codedeploy/latest/userguide/codedeploy-agent-operations-install-ubuntu.html
# ... this seems to be automatically done by AWS when setting up codedeploy.
cd /tmp
REGION=us-east-2 # US East (Ohio)
wget https://aws-codedeploy-$REGION.s3.$REGION.amazonaws.com/latest/install
chmod u+x ./install
sudo ./install auto > /tmp/logfile
# Update: sudo /opt/codedeploy-agent/bin/install auto

# Required ?
sudo mkdir -p /opt/codedeploy-agent/deployment-root/deployment-instructions

# Configure working directory and copy critical files into place
cd /var/www/apache-flask/app/
python3 -m venv venv


# python3 -m venv venv
# python3 -m pip install -r requirements.txt
# 
# COPY docker/apache-flask.conf /etc/apache2/sites-available/
# COPY docker/apache-flask.wsgi /var/www/apache-flask/app
# Set up and run Apache
# a2ensite apache-flask
# a2enmod headers
# a2dissite 000-default.conf

# Copy non-critical files late, since docker will rebuild everything below if these files change
# COPY . /var/www/apache-flask/app

# Temporary
# errorlog=/var/log/apache2/error.log
# accesslog=/var/log/apache2/access.log
# 
# EXPOSE 80
# cd /var/www/apache-flask/app
# /usr/sbin/apache2ctl -D FOREGROUND
