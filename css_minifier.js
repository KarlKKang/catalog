import postcss from 'postcss';
import cssnano from 'cssnano';
import * as fs from './file_system.js';

export default function (srcDir, destDir, srcFilename, destFilename) {
    if (destFilename === undefined) {
        destFilename = srcFilename
    }
    fs.read(srcDir + srcFilename, function (data) {
        postcss([
            cssnano({
                preset: [
                    'cssnano-preset-advanced',
                    {
                        autoprefixer: {
                            add: true,
                            remove: true,
                            supports: true,
                            flexbox: true,
                        },
                        cssDeclarationSorter: {
                            order: "smacss"
                        },
                        zindex: false,
                        discardUnused: false,
                        reduceIdents: false
                    }
                ]
            })
        ]).process(data, { from: srcDir + srcFilename, to: destDir + destFilename }).then(result => {
            result.warnings().forEach(warn => {
                console.warn(warn.toString())
            });
            fs.mkdir(destDir);
            fs.write(destDir + destFilename, result.css);
        });
    });
}