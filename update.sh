#!/bin/bash -x

echo -n ./update2.sh ./update3.sh react-app/update.sh | xargs -d ' ' -P3 -n1 bash -c 'cd $(dirname $1); ./$(basename $1)' -
