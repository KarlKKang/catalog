#!/usr/bin/env bash

for i in "$@"; do
    node -c "$i" || exit 1
done

echo "$# files checked successfully"
