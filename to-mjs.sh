#!/usr/bin/env bash

if [ "${DEBUG}" == "yes" ]; then set -ex; fi

find ./dist/ -type f -name "*.js" -exec sh -c 'mv "$1" "${1%.js}.mjs"' _  {} \;
