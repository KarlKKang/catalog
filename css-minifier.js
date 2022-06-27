const fs = require('fs');
const postcss = require('postcss');
const cssnano = require('cssnano');

module.exports = function (srcDir, destDir, srcFilename, destFilename) {
    if (destFilename === undefined) {
        destFilename = srcFilename
    }
    fs.readFile(srcDir + srcFilename, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
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
                        discardUnused: false
                    }
                ] 
            })
        ]).process(data, {from: srcDir + srcFilename, to: destDir + destFilename}).then(result => {
            result.warnings().forEach(warn => {
                console.warn(warn.toString())
            });
            writeFile (destDir + destFilename, result.css);
        });
    });
}

function writeFile (file, data) {
	fs.readFile(file, 'utf8', (err_r, read) => {
		if (err_r || data != read) {
			fs.writeFile(file, data, err_w => {
				if (err_w) {
					console.error(err_w);
				}
				console.log('Successfully written ' + file);
			});
		} else {
			console.log(file + ' not modified');
		}
	});
}