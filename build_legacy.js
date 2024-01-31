import lodashTemplate from 'lodash/template.js';
import babel from '@babel/core';
import { minify as terser } from 'terser';
import cssMinify from './css_minifier.js';
import * as fs from './file_system.js';
import { DOMAIN } from './env/index.cjs';

process.env.BROWSERSLIST_ENV = 'legacy';
const dev = process.argv[2] === 'dev';

let destDirPrefix = './dist/';
if (dev) {
    destDirPrefix = './dev/';
}

const srcFile = './src/script/browser.js';
const destFile = destDirPrefix + 'script/browser.js';
fs.read(srcFile, function (code) {
    code = lodashTemplate(code)({ data: { domain: (dev ? 'alpha.' : '') + DOMAIN } });
    babel.transform(
        code,
        { filename: srcFile, presets: ["@babel/preset-env"] },
        function (err, result) {
            if (err) {
                console.error(err);
                return;
            }
            if (dev) {
                fs.write(destFile, result.code);
                return;
            }
            terser(result.code, {
                ecma: 5,
                compress: {
                    passes: 5
                },
                ie8: true,
                safari10: true,
            }).then((minified) => {
                fs.write(destFile, minified.code);
            }).catch((e) => {
                console.error(e);
            });
        }
    );
});

cssMinify('./src/css/', destDirPrefix + 'style/', 'unsupported_browser.css');