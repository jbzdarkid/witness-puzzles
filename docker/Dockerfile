# Adapted from https://github.com/carlostighe/apache-flask/blob/master/Dockerfile
FROM debian:stable-20210721

RUN (apt-get update || true) && apt-get install -y \
  apache2 \
  build-essential \
  libapache2-mod-wsgi-py3 \
  python3-pip \
  && rm -rf /var/lib/apt/lists/*

# Configure working directory and copy critical files into place
COPY requirements.txt /var/www/apache-flask/app
COPY requirements/ /var/www/apache-flask/app/requirements/
RUN python3 -m pip install -r requirements.txt

# For debugging purposes, install & configure vim. For now.
RUN (apt-get update || true) && apt-get install -y \
  vim
COPY docker/.vimrc ~/.vimrc

COPY docker/apache-flask.conf /etc/apache2/sites-available/
COPY docker/apache-flask.wsgi /var/www/apache-flask/
# Set up and run Apache
RUN a2ensite apache-flask
RUN a2enmod headers
RUN a2dissite 000-default.conf

# Copy non-critical files late, to avoid cache invalidation
COPY . /var/www/apache-flask/app

EXPOSE 80
WORKDIR /var/www/apache-flask
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]
