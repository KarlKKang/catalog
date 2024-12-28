#!/usr/bin/env bash

set -e

directory="./dist"

if [[ "$1" == "dev" ]]; then
    directory="./dev"
fi

mv $directory/index.html ./temp/index.html
mv $directory/unsupported_browser.html ./temp/unsupported_browser.html
mkdir -p ./temp/icon && mv $directory/icon/manifest.webmanifest ./temp/icon/manifest.webmanifest
