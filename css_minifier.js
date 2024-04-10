import postcss from 'postcss';
import cssnano from 'cssnano';
import * as fs from './file_system.js';
import { cssMinifyOptions } from './build_config.js';

export default function (srcDir, destDir, srcFilename, destFilename) {
    if (destFilename === undefined) {
        destFilename = srcFilename
    }
    fs.read(srcDir + srcFilename, function (data) {
        postcss([
            cssnano(cssMinifyOptions)
        ]).process(data, { from: srcDir + srcFilename, to: destDir + destFilename }).then(result => {
            result.warnings().forEach(warn => {
                console.warn(warn.toString())
            });
            fs.mkdir(destDir);
            fs.write(destDir + destFilename, result.css);
        });
    });
}