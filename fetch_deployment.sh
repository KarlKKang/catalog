#!/usr/bin/env bash

export MSYS2_ARG_CONV_EXCL="*"

if [[ "$#" -ne 2 || ("$1" != "featherine-website" && "$1" != "featherine-website-alpha") ]]; then
    echo "Usage: $0 S3_BUCKET DIRECTORY" >&2
    exit 1
fi

mkdir -p "$2" || {
    echo "Failed to create directory $2" >&2
    exit 1
}
aws s3 sync "s3://$1/" "$2" --delete 2>>"fetch_deployment.log"
node ./aws-s3-js/verify_dir.js "$1" "/" "$2" 2>>"fetch_deployment.log"
