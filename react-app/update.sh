#!/bin/bash -x

docker run \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -w /opt \
  node:23.5.0-bookworm sh -e -x -c '
cp /srv/package.json .
npm install --package-lock-only
cp package-lock.json /srv
'
