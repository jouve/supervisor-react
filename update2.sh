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
  -v $PWD:/srv3 \
  -w /srv alpine:3.12 sh -x -c "
set -e
apk add --no-cache alpine-conf
setup-apkcache /var/cache/apk
apk add --no-cache python2-dev python3;
python3 -m venv /tmp/venv
/tmp/venv/bin/pip install pipenv
sed -e 's/flake8-bugbear/flake8/' -e 's/python_version.*/python_version = \"2\"/' -e '/mypy/d' /srv3/Pipfile > Pipfile
cp /srv3/setup* .
/tmp/venv/bin/pipenv lock --dev
/tmp/venv/bin/pipenv lock --dev -r | sed -e '1,2d' > /srv3/py2.txt
"

