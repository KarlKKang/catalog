import minifier from './css_minifier.js';

const dev = process.argv[2] === 'dev';
let destDir = './dist/css/';
if (dev) {
    destDir = './dev/css/';
}

const entries = [
    '404.css',
    'bangumi.css',
    'console.css',
    'image.css',
    'index.css',
    'login.css',
    'main.css',
    'message.css',
    'my_account.css',
    'news.css',
    'portal_form.css',
    'register.css',
    'player.css',
    'pop_up_window.css',
];

for (const filename of entries) {
    minifier('./src/css/', destDir, filename);
}