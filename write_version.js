import * as fs from './file_system.js';

const BUILD = process.env.BUILD;

let directory = './dev/';
if (BUILD === 'production') {
    directory = './dist/';
}

const pkg = JSON.parse(fs.readSync('./package.json'));
fs.write(directory + 'version', pkg.version ?? '0.0.0');
