import lodashTemplate from 'lodash/template.js';
import path from 'path';
import { minify as htmlMinify } from 'html-minifier-terser';
import babel from '@babel/core';
import { minify as terser } from 'terser';
import cssMinify from './css-minifier.js';
import * as fs from './file_system.js';
import { htmlMinifyOptions } from './build_config.cjs';
import { DOMAIN } from './env/index.cjs';

process.env.BROWSERSLIST_ENV = 'legacy';
const dev = process.argv[2] === 'dev';

let destDirPrefix = './dist/';
if (dev) {
    destDirPrefix = './dev/';
}
fs.mkdir(destDirPrefix + 'script_legacy');
fs.mkdir(destDirPrefix + 'css');

const htmlEntries = ['unsupported_browser', '404'];
for (const entry of htmlEntries) {
    const html = ejsLoader('./src/html/' + entry + '.ejs').default({ titleSuffix: DOMAIN + (dev ? ' (alpha)' : '') });
    htmlMinify(html, htmlMinifyOptions).then((data) => {
        fs.write(destDirPrefix + entry + '.html', data);
    }).catch((e) => {
        console.error(e);
    });
}

const jsEntries = ['browser', '404'];
for (const entry of jsEntries) {
    const filename = './src/script/' + entry + '.ts';
    fs.read(filename, function (code) {
        code = lodashTemplate(code)({ data: { domain: DOMAIN } });
        babel.transform(
            code,
            { filename: filename, presets: ["@babel/preset-env", "@babel/preset-typescript"] },
            function (err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                if (dev) {
                    fs.write(destDirPrefix + 'script_legacy/' + entry + '.js', result.code);
                    return;
                }
                terser(result.code, {
                    ecma: 5,
                    parse: {},
                    compress: {
                        passes: 5
                    },
                    mangle: true, // Note `mangle.properties` is `false` by default.
                    module: true,
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
                    fs.write(destDirPrefix + 'script_legacy/' + entry + '.js', minified.code);
                }).catch((e) => {
                    console.error(e);
                });
            }
        );
    });
}

cssMinify('./src/css/', destDirPrefix + 'css/', 'unsupported_browser.css');

function ejsLoader(file) {
    const content = fs.readSync(file);
    return {
        default: function (options) {
            return lodashTemplate(content)({
                require: function (relativePath) {
                    return ejsLoader(path.dirname(file) + '/' + relativePath);
                },
                data: options
            });
        }
    };
}