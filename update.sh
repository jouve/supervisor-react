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

$SUDO docker run -i -t \
  $cache \
  -v $PWD:/srv \
  -w /srv \
  alpine:3.13.0 \
  sh -x -c "
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache cargo gcc libffi-dev musl-dev openssl-dev python3-dev;
python3 -m venv /usr/share/poetry
/usr/share/poetry/bin/pip install --upgrade pip
/usr/share/poetry/bin/pip install wheel
/usr/share/poetry/bin/pip install poetry
/usr/share/poetry/bin/poetry lock
"
