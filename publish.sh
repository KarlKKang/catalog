#!/usr/bin/env bash

export MSYS2_ARG_CONV_EXCL="*"

if [[ "$#" -ne 2 || ("$1" != "featherine-website" && "$1" != "featherine-website-alpha") || ! (-d "$2") ]]; then
    echo "Usage: $0 S3_BUCKET DIRECTORY" >&2
    exit 1
fi

if [[ "$1" == "featherine-website" ]]; then
    opt='--no-overwrite ^(script|style|font)\/ --no-overwrite-exclude ^(script\/browser\.js|style\/unsupported_browser\.css)$'
    node ./aws-s3-js/upload.js "$1" "/" "$2/" --dry-run $opt 2>>"publish.log" || exit 1
    echo
    node ./aws-s3-js/upload.js "$1" "/" "$2/" \
        --exclude '^(sw\.js|index\.html|version)$' \
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
        $opt 2>>"publish.log" || exit 1
    echo "Waiting 10 seconds for the CloudFront error TTL to expire..."
    sleep 10
    echo
    node ./aws-s3-js/upload.js "$1" "/index.html" "$2/index.html" --mime '\.html$' 'text/html' 2>>"publish.log" || exit 1
    node ./aws-s3-js/upload.js "$1" "/version" "$2/version" --mime '.*' 'text/plain;charset=utf-8' 2>>"publish.log" || exit 1
    echo "Please clear the CloudFront cache for any file that does not use hash-based filenames. Some common examples are:"
    echo "/index.html"
    echo "/version"
    echo "/script/browser.js"
    echo "/unsupported_browser.html"
    echo "/style/unsupported_browser.css"
    echo "/icon/*"
    read -p "Press Enter to continue..." -r
    echo
    node ./aws-s3-js/upload.js "$1" "/sw.js" "$2/sw.js" --mime '\.js$' 'application/javascript;charset=utf-8' 2>>"publish.log" || exit 1
    echo "All files have been uploaded. Please clear the CloudFront cache for /sw.js."
else
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
        --mime '^version$' 'text/plain;charset=utf-8' \
        '--delete' 2>>"publish.log"
fi
