#!/bin/bash -x

if [ "$(basename "$(readlink -f "$(which docker)")")" != podman ]; then
  if ! test -w /var/run/docker.sock; then
    SUDO=sudo
  else
    SUDO=
  fi
fi

if docker container inspect cache_cache_1 &>/dev/null; then
  cache=--volumes-from=cache_cache_1
else
  cache=
fi

$SUDO docker run \
  $cache \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -v node_nodumes:/srv/node_modules \
  -w /srv \
  alpine:3.15.0 sh -x -c '
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache make nodejs npm python2
npx npm install
npx npm run build
'
