# syntax=docker/dockerfile:1
FROM httpd:2.4

# Change to bash instead of shell.
#SHELL ["/bin/bash", "-c"]

# Temporary. I think.
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app/

# Upload entire repo to docker
# Apparently this goes into /usr/local/apache2
COPY . .

# Install dependencies
RUN apt-get update && apt-get install -y \
  libapache2-mod-wsgi-py3 \
  python3-pip \
  software-properties-common

RUN python3 -m pip install -r requirements.txt

# https://github.com/carlostighe/apache-flask -- Use this as a base.