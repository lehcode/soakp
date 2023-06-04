#!/usr/bin/env sh

set -eo pipefail

if [ "${DEBUG}" = "yes" ]; then
  set -x
  env
fi

mkdir -p "${SSL_CERT_DIR}"
cp -rf "$(pwd)/ca" "${SSL_CERT_DIR}"
cp -rf "$(pwd)/cert" "${SSL_CERT_DIR}"

if [ "${DEBUG}" = "yes" ]; then ls -al "${SSL_CERT_DIR}"; fi
if [ "${DEBUG}" = "yes" ]; then sleep infinity; fi
