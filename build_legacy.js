import babel from '@babel/core';
import { minify as terser } from 'terser';
import cssMinify from './css_minifier.js';
import * as fs from './file_system.js';

process.env.BROWSERSLIST_ENV = 'legacy';
const BUILD = process.env.BUILD;

let destDirPrefix = './dev/';
if (BUILD === 'production') {
    destDirPrefix = './dist/';
}

const srcFile = './src/script/browser.js';
const destFile = destDirPrefix + 'script/browser.js';
fs.read(srcFile, function (code) {
    babel.transform(
        code,
        { filename: srcFile, presets: ["@babel/preset-env"] },
        function (err, result) {
            if (err) {
                console.error(err);
                return;
            }
            if (BUILD === 'alpha') {
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