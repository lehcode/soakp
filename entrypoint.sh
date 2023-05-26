#!/usr/bin/env bash

set -e
if [ "${DEBUG}" == "yes" ]; then
  set -ex
  env
fi

#npm install

#if [ "${DEBUG}" == "yes" ]; then
#  npm run dev
#fi

if [ "${NODE_ENV}" == "development" ]; then
  npm run dev
else
  npm serve
fi
