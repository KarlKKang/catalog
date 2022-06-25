const minifier = require('./css-minifier');

const dev = process.argv[2] === 'dev';

const srcDir = './src/css/';
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
	minifier(filename, srcDir, destDir);
}

minifier('video-js.min.css', './node_modules/video.js/dist/', destDir);