#!/usr/bin/env bash

if [[ "$#" -ne 2 || ("$1" != "featherine-website" && "$1" != "featherine-website-alpha") || ! (-d "$2") ]]; then
    echo "Usage: $0 S3_BUCKET DIRECTORY" >&2
    exit 1
fi

opt='--no-overwrite ^(script|style|font)\/ --no-overwrite-exclude ^(script\/browser\.js|style\/unsupported_browser\.css)$'
if [[ "$1" == "featherine-website-alpha" ]]; then
    opt='--delete'
fi

node ./aws-s3-js/upload.js "$1" "/" "$2/" \
    --mime '\.css$' 'text/css' \
    --mime '\.html$' 'text/html' \
    --mime '\.js$' 'application/javascript;charset=utf-8' \
    --mime '\.map$' 'application/json' \
    --mime '\.woff2$' 'font/woff2' \
    --mime '\.txt$' 'text/plain;charset=utf-8' \
    --mime '\.xml$' 'text/xml' \
    --mime '\.ico$' 'image/vnd.microsoft.icon' \
    --mime '\.svg$' 'image/svg+xml' \
    --mime '\.png$' 'image/png' \
    --mime '\.webmanifest$' 'application/manifest+json' \
    --mime '\.json$' 'application/json' \
    $opt 2>>"publish.log"
