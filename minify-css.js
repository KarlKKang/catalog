const fs = require('fs');
const postcss = require('postcss');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');

const dev = process.argv[2] === 'dev';

const baseDir = './src/css/';
var destDir = './dist/css/';
if (dev) {
	destDir = './dev/css/';
}

const entry = [
	'account.css',
	'bangumi-hls.css',
	'console.css',
	'image.css',
	'index.css',
	'info.css',
	'login.css',
	'main.css',
	'message.css',
	'portal_form.css',
	'register.css',
	'videojs_mod.css',
];

for (var i = 0; i < entry.length; i++) {
	let filename = entry[i];
	fs.readFile(baseDir + filename, 'utf8', (err, data) => {
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
		]).process(data, {from: baseDir + filename, to: destDir + filename}).then(result => {
			result.warnings().forEach(warn => {
				console.warn(warn.toString())
			});
			writeFile (destDir + filename, result.css);
		});
	});
}

// copy css for video.js
fs.readFile('./node_modules/video.js/dist/video-js.min.css', 'utf8', (err, data) => {
	if (err) {
		console.error(err);
		return;
	}
	writeFile (destDir + 'video-js.min.css', data);
});

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