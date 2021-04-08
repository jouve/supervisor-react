#!/bin/bash -x

if ! test -w /var/run/docker.sock; then
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
  alpine:3.13.2 sh -x -c '
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache make nodejs yarn python2
cp /usr/share/supervisor-react/package.json .
node --version
yarn install
yarn upgrade
cp yarn.lock /usr/share/supervisor-react
'
