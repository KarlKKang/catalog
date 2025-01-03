#!/usr/bin/env bash

set -e

directory="./dev"

if [[ "$BUILD" == "production" ]]; then
    directory="./dist"
fi

mv $directory/index.html ./temp/index.html
mv $directory/unsupported_browser.html ./temp/unsupported_browser.html
mkdir -p ./temp/icon && mv $directory/icon/manifest.webmanifest ./temp/icon/manifest.webmanifest
