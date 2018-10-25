#!/bin/bash

# in driver mode WORKDIR is ignored
cd /app

CMD="$@"

exec ${CMD}