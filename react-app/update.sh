#!/bin/bash -x

if ! test -w /var/run/docker.sock
then
  SUDO=sudo
else
  SUDO=
fi

if docker container inspect cache_cache_1 &>/dev/null; then
  cache=--volumes-from=cache_cache_1
else
  cache=
fi

$SUDO docker run \
  $cache \
  -v "$(readlink -f "$(dirname "$0")")":/usr/share/supervisor-react \
  -w /srv \
  alpine:3.14.2 sh -x -c '
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache npm
cp /usr/share/supervisor-react/package.json .
npx npm install --package-lock-only
cp package-lock.json /usr/share/supervisor-react
'
