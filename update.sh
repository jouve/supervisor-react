#!/bin/bash -x

sudo nerdctl run \
  -v "$(readlink -f "$(dirname "$0")")":/srv \
  -w /srv \
  jouve/poetry:1.2.2-alpine3.16.3 poetry lock
