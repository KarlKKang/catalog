import babel from '@babel/core';
import { minify as terser } from 'terser';
import * as fs from './file_system.js';
import { terserOptions } from './build_config.cjs';

const dev = process.argv[2] === 'dev';

const srcDir = './temp/'
let destDir = './dist/';
if (dev) {
    destDir = './dev/';
}

const files = ['sw.js'];
fs.readdirSync(srcDir).forEach(file => {
    if (file.startsWith('workbox-') && file.endsWith('.js')) {
        files.push(file);
    }
});

files.forEach(file => {
    const srcFilePath = srcDir + file;
    const destFilePath = destDir + file;
    fs.read(srcFilePath, function (code) {
        babel.transform(
            code,
            {
                filename: srcFilePath,
                presets: ["@babel/preset-env"],
                sourceMaps: dev,
            },
            function (err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                fs.unlink(srcFilePath);
                fs.unlink(srcFilePath + '.map');
                if (dev) {
                    result.code += '\n//# sourceMappingURL=' + file + '.map';
                    fs.write(destFilePath, result.code);
                    if (file === 'sw.js') {
                        result.map.sources = ['script/sw.js'];
                    }
                    fs.write(destFilePath + '.map', JSON.stringify(result.map));
                    return;
                }
                terser(result.code, terserOptions).then((minified) => {
                    fs.write(destFilePath, minified.code);
                }).catch((e) => {
                    console.error(e);
                });
            }
        );
    });
});