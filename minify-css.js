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
					{autoprefixer: {
						add: true,
						remove: true,
						supports: true,
						flexbox: true
					},
					cssDeclarationSorter: {
						order: "smacss"
					}}
				] 
			})
		]).process(data).then(result => {
			result.warnings().forEach(warn => {
				console.warn(warn.toString())
			});
			fs.writeFile(destDir + filename, result.css, err => {
				if (err) {
					console.error(err);
					return;
				}
				console.log('Successfully written ' + destDir + filename);
			});
		});
	});
}

// copy css for video.js
fs.readFile('./node_modules/video.js/dist/video-js.min.css', 'utf8', (err, data) => {
	if (err) {
		console.error(err);
		return;
	}
	fs.writeFile(destDir + 'video-js.min.css', data, err => {
		if (err) {
			console.error(err);
		}
		console.log('Successfully written ' + destDir + 'video-js.min.css');
	});
});