#!/usr/bin/env bash

if [[ "$#" -ne 2 || ("$1" != "featherine-website" && "$1" != "featherine-website-alpha") || ! (-d "$2") ]]; then
    echo "Usage: $0 S3_BUCKET DIRECTORY" >&2
    exit 1
fi

echo "Uploading css"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.css" --no-guess-mime-type --content-type="text/css" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading html"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.html" --no-guess-mime-type --content-type="text/html" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading js"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.js" --no-guess-mime-type --content-type="text/javascript" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading source map"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.map" --no-guess-mime-type --content-type="application/json" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading woff"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.woff" --no-guess-mime-type --content-type="font/woff" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading woff2"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.woff2" --no-guess-mime-type --content-type="font/woff2" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading txt"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.txt" --no-guess-mime-type --content-type="text/plain" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading xml"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.xml" --no-guess-mime-type --content-type="text/xml" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading ico"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.ico" --no-guess-mime-type --content-type="image/vnd.microsoft.icon" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading svg"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.svg" --no-guess-mime-type --content-type="image/svg+xml" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading png"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.png" --no-guess-mime-type --content-type="image/png" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading webmanifest"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.webmanifest" --no-guess-mime-type --content-type="application/manifest+json" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"

echo "Uploading json"
aws s3 sync "$2" "s3://$1/" --exclude "*" --include "*.json" --no-guess-mime-type --content-type="application/json" --metadata-directive="REPLACE" --delete 2>>"publish.log"
echo "DONE"
printf "\n"
