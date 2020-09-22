#!/bin/bash -x

if ! test -w /var/run/docker.sock; then
  SUDO=sudo
else
  SUDO=
fi

docker volume create apk-cache || true
docker volume create yarn-cache || true
$SUDO docker run \
  -v yarn-cache:/usr/local/share/.cache/yarn \
  -v apk-cache:/var/cache/apk \
  -v $PWD:/usr/share/supervisor-react \
  -w /srv \
  alpine:3.12 sh -x -c '
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache make nodejs yarn python2
cp /usr/share/supervisor-react/package.json .
yarn install
yarn upgrade
cp yarn.lock /usr/share/supervisor-react
'
