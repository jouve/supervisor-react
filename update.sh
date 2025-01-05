#!/bin/bash -x

docker run \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -w /srv \
  jouve/poetry:2.0.0 poetry lock
