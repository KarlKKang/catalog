#!/usr/bin/env bash

if [[ "$#" -ne 2 || ("$1" != "featherine-website" && "$1" != "featherine-website-alpha") || ! (-d "$2") ]]; then
    echo "Usage: $0 S3_BUCKET DIRECTORY" >&2
    exit 1
fi

echo "Syncing s3://$1/ to $2"
aws s3 sync "s3://$1/" "$2" 2>>"init_sync.log"
echo "DONE"
printf "\n"