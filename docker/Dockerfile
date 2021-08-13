# Adapted from https://github.com/carlostighe/apache-flask/blob/master/Dockerfile
FROM debian:stable-20210721

# Configure working directory -- all tasks should run from and save relative to here, unless otherwise specified.
# RUN mkdir -p /var/www/apache-flask/app
WORKDIR /var/www/apache-flask/app
COPY . .

# Install dependencies
RUN apt-get update && apt-get install -y \
  apache2 \
  build-essential \
  libapache2-mod-wsgi-py3 \
  python3-pip \
  && rm -rf /var/lib/apt/lists/*
RUN python3 -m pip install -r requirements.txt

# Set up logging
RUN ln -sf /proc/self/fd/1 /var/log/apache2/access.log
RUN ln -sf /proc/self/fd/1 /var/log/apache2/error.log

# Set up and run Apache
RUN mv docker/apache-flask.conf /etc/apache2/sites-available/apache-flask.conf
RUN a2ensite apache-flask
RUN a2enmod headers
RUN a2dissite 000-default.conf
EXPOSE 80
WORKDIR /var/www/apache-flask
CMD ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]
