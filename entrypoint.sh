#!/usr/bin/env bash

set -e
if [ "${DEBUG}" = "yes" ]; then
  set -ex
  env
fi

# if [ ! -d "node_modules" ]; then yarn install; fi
yarn install

if [ "${NODE_ENV}" = "development" ]; then
  yarn dev
else
  yarn serve
fi
