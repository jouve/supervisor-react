#!/bin/bash -x

docker run \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -w /srv \
  jouve/poetry:1.6.1 poetry lock
