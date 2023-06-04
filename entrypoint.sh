#!/usr/bin/env bash

set -eo pipefail

if [[ "${DEBUG}" == "yes" ]]; then
  set -x
  env
fi

echo "${USER_PWD}" | sudo -S chown -R ${HOST_USER_UID}:docker ./
echo "${USER_PWD}" | sudo -S chown -R ${HOST_USER_UID}:docker "${DATA_DIR}"

if [[ "${DEBUG}" == "yes" ]]; then ls -al ${SSL_CERT_DIR}; fi
if [[ "${DEBUG}" == "yes" ]]; then ls -al ${SERVER_ROOT}; fi

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
