#!/bin/bash -x

docker run \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -w /srv \
  jouve/poetry:1.8.3-alpine3.20.1 poetry lock
