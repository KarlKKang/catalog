#!/usr/bin/env bash

set -e

for dir in . hls.js aws-s3-js; do
    (cd "$dir" && npm ci)
done
npm run build:hls.js
