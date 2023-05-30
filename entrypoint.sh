#!/usr/bin/env bash

set -e
if [ "${DEBUG}" = "yes" ]; then
  set -ex
  env
fi

#sudo cat /etc/sudoers
ls -al /

# sudo chown -R node:node /.npm /.cache/yarn

if [ ! -d "node_modules" ]; then yarn install; fi

if [ "${NODE_ENV}" = "development" ]; then
  yarn dev
else
  yarn serve
fi
