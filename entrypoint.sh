#!/usr/bin/env bash

set -eo pipefail

if [[ "${DEBUG}" == "yes" ]]; then
  set -x
  env
fi

echo "${USER_PWD}" | sudo -S chown -R node:node ./
echo "${USER_PWD}" | sudo -S chown -R node:node "${DATA_DIR}"

if [[ ! -d "node_modules" ]]; then
  yarn install
fi

if [[ "${NODE_ENV}" == "development" ]]; then
  yarn dev
  exit $?
fi

if [[ "${NODE_ENV}" == "testing" ]]; then
  yarn test
  exit $?
fi

yarn serve
exit $?
