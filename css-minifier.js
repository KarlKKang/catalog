const fs = require('fs');
const postcss = require('postcss');
const cssnano = require('cssnano');

module.exports = function (filename, srcDir, destDir) {
    fs.readFile(srcDir + filename, 'utf8', (err, data) => {
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
                        zindex: false
                    }
                ] 
            })
        ]).process(data, {from: srcDir + filename, to: destDir + filename}).then(result => {
            result.warnings().forEach(warn => {
                console.warn(warn.toString())
            });
            writeFile (destDir + filename, result.css);
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