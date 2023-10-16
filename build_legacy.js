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
fs.mkdir(destDirPrefix + 'script');
fs.mkdir(destDirPrefix + 'style');

const jsEntries = ['browser'];
for (const entry of jsEntries) {
    const filename = './src/script/' + entry + '.ts';
    fs.read(filename, function (code) {
        code = lodashTemplate(code)({ data: { domain: (dev ? 'alpha.' : '') + DOMAIN } });
        babel.transform(
            code,
            { filename: filename, presets: ["@babel/preset-env", "@babel/preset-typescript"] },
            function (err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                if (dev) {
                    fs.write(destDirPrefix + 'script/' + entry + '.js', result.code);
                    return;
                }
                terser(result.code, {
                    ecma: 5,
                    parse: {},
                    compress: {
                        passes: 5
                    },
                    mangle: true, // Note `mangle.properties` is `false` by default.
                    module: false,
                    // Deprecated
                    output: null,
                    format: null,
                    //toplevel: false,
                    nameCache: null,
                    ie8: true,
                    keep_classnames: undefined,
                    keep_fnames: false,
                    safari10: true,
                }).then((minified) => {
                    fs.write(destDirPrefix + 'script/' + entry + '.js', minified.code);
                }).catch((e) => {
                    console.error(e);
                });
            }
        );
    });
}

cssMinify('./src/css/', destDirPrefix + '/style/', 'unsupported_browser.css');