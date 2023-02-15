#!/bin/bash -x

sudo nerdctl run \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -w /srv \
  jouve/poetry:1.3.2-alpine3.17.2 poetry lock
