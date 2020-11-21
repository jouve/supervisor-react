#!/bin/bash -x

if ! test -w /var/run/docker.sock; then
  SUDO=sudo
else
  SUDO=
fi

docker volume create apk-cache || true
docker volume create pip-cache || true
docker volume create poetry-cache || true
docker volume create poetry-artifacts || true
$SUDO docker run -i -t \
  -v apk-cache:/var/cache/apk \
  -v pip-cache:/root/.cache/pip \
  -v poetry-artifacts:/root/.cache/pypoetry/artifacts \
  -v poetry-cache:/root/.cache/pypoetry/cache \
  -v $PWD:/srv \
  -w /srv $(head -n1 Dockerfile | sed -n -e 's/FROM //p') sh -x -c "
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache gcc libffi-dev musl-dev openssl-dev python3-dev;
python3 -m venv /usr/share/poetry
/usr/share/poetry/bin/pip install --upgrade pip
/usr/share/poetry/bin/pip install wheel
/usr/share/poetry/bin/pip install poetry
/usr/share/poetry/bin/poetry lock
"
