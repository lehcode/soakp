#!/usr/bin/env bash

if [ "${DEBUG}" == "yes" ]; then
  set -ex
  env
else
  set -e
fi

npm install
npm start

