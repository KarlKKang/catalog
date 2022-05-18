chcp 65001 >NUL
@echo off

ECHO Uploading html
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.html" --no-guess-mime-type --content-type="text/html" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading js
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.js" --no-guess-mime-type --content-type="text/javascript" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading css
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.css" --no-guess-mime-type --content-type="text/css" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading woff
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.woff" --no-guess-mime-type --content-type="font/woff" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading woff2
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.woff2" --no-guess-mime-type --content-type="font/woff2" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading txt
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.txt" --no-guess-mime-type --content-type="text/plain" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading xml
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.xml" --no-guess-mime-type --content-type="text/xml" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading ico
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.ico" --no-guess-mime-type --content-type="image/vnd.microsoft.icon" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading svg
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.svg" --no-guess-mime-type --content-type="image/svg+xml" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading png
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*.png" --no-guess-mime-type --content-type="image/png" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

ECHO Uploading site.webmanifest
aws s3 sync "./dist/" "s3://featherine-website/" --exclude "*" --include "*site.webmanifest" --no-guess-mime-type --content-type="application/manifest+json" --metadata-directive="REPLACE" --delete 2>> "publish.log"
ECHO DONE
ECHO,

pause