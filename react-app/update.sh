#!/bin/bash -x

docker run \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -w /opt \
  alpine:3.20.1 sh -x -c '
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache npm
cp /srv/package.json .
npm install --package-lock-only
cp package-lock.json /srv
'
