#!/usr/bin/env bash

set -e

export BUILD=$1
if [[ "$BUILD" != "production" && "$BUILD" != "alpha" && "$BUILD" != "beta" ]]; then
    echo "Usage: $0 <production|alpha|beta>"
    exit 1
fi

output_dir='dev'
if [[ "$BUILD" == "production" ]]; then
    output_dir="dist"
fi

npm run lint
npm run check-circular
mkdir -p ./temp
node build_legacy.js
bash pre_favicon.sh
webpack --progress --config webpack.js --config-name main
node post_favicon.js
webpack --progress --config webpack.js --config-name sw
bash check_syntax.sh ${output_dir}/**/*.js
node write_version.js
