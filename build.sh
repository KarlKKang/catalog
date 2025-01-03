#!/usr/bin/env bash

set -e

output_dir='dev'

if [[ "$BUILD" == "production" ]]; then
    output_dir="dist"
fi

npm run lint
npm run check-circular
node build_legacy.js
sh pre_favicon.sh
webpack --progress --config webpack.js --config-name main
node post_favicon.js
webpack --progress --config webpack.js --config-name sw
sh check_syntax.sh ${output_dir}/**/*.js
