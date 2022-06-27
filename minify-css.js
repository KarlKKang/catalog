const minifier = require('./css-minifier');

const dev = process.argv[2] === 'dev';

const srcDir = './src/css/';
var destDir = './dist/css/';
if (dev) {
	destDir = './dev/css/';
}

const entries = [
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

for (let filename of entries) {
	minifier(srcDir, destDir, filename);
}

minifier('./node_modules/video.js/dist/', destDir, 'video-js.min.css');