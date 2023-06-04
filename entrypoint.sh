#!/usr/bin/env bash

set -e
if [ "${DEBUG}" = "yes" ]; then
  set -ex
  env
fi

echo ${USER_PWD} | sudo -S chown -R node:node ./
echo ${USER_PWD} | sudo -S chown -R node:node ${DATA_DIR}
# echo ${USER_PWD} | sudo -S chown -R node:node /etc/ssl/soakp
#  echo ${USER_PWD} | sudo -S ls -al ${DATA_DIR}
#  sudo ls -al ${WORKDIR}
# sudo ls -al ${DATA_DIR}
#  ls -al /tmp

if [ ! -d "node_modules" ]; then yarn install; fi

if [ "${NODE_ENV}" = "development" ]; then
  yarn dev
else
  yarn serve
fi
