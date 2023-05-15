#!/bin/bash -x

sudo nerdctl run \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -w /srv \
  jouve/poetry:1.4.2-alpine3.18.0 poetry lock
