#!/usr/bin/env bash

set -e
if [ "${DEBUG}" = "yes" ]; then
  set -ex
  env
fi

echo ${NODE_USER_PWD} | sudo -S chown -R node:node ./
echo ${NODE_USER_PWD} | sudo -S cat /etc/sudoers
echo ${NODE_USER_PWD} | sudo -S ls -al ${DATA_FILE_DIR}
sudo ls -al ${WORKDIR}

if [ ! -d "node_modules" ]; then yarn install; fi

if [ "${NODE_ENV}" = "development" ]; then
  yarn dev
else
  yarn serve
fi
