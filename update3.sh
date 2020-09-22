#!/bin/bash -x

if ! test -w /var/run/docker.sock; then
  SUDO=sudo
else
  SUDO=
fi

docker volume create apk-cache || true
docker volume create pip-cache || true
docker volume create pipenv-cache || true
$SUDO docker run \
  -v pip-cache:/root/.cache/pip \
  -v pipenv-cache:/root/.cache/pipenv \
  -v apk-cache:/var/cache/apk \
  -v $PWD:/srv \
  -w /srv alpine:3.12 sh -x -c "
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache python3-dev;
python3 -m venv /tmp/venv
/tmp/venv/bin/pip install pipenv
/tmp/venv/bin/pip freeze > pipenv.txt
/tmp/venv/bin/pipenv lock --dev
/tmp/venv/bin/pipenv lock --dev -r | sed -e '1,2d' > py3.txt
"
