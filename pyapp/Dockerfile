# Use an official Python runtime as a parent image
ARG python_version_tag
FROM python:${python_version_tag}

LABEL maintainer="Lehcode <3556648+lehcode@users.noreply.github.com>"
LABEL description="Python API for SOAKP server."

ARG debug

ENV DEBUG=${debug}

# Set the working directory in the container to /app
WORKDIR /srv/soakp/python

# Add the current directory contents into the container at /app
COPY requirements.txt .

RUN if [ "${debug}" != "yes" ]; then set -e; else set -ex; fi \
    && apt update \
    && apt -y upgrade

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Make port 5000 available to the world outside this container
#EXPOSE 5000

# Run app.py when the container launches
# `myapp` is the name of the Python module that contains your Flask application,
# and app is the name of the Flask instance in that module.
CMD ["gunicorn", "-w 4", "backend:app"]
