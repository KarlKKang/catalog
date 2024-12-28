import * as fs from './file_system.js';

const dev = process.argv[2] === 'dev';

let directory = './dist/';
if (dev) {
    directory = './dev/';
}

const removeContent = {
    'index.html': '<meta content=%remove% name=theme-color>',
    'unsupported_browser.html': '<meta content=%remove% name=theme-color>',
    'icon/manifest.webmanifest': '  "theme_color": "%remove%",\n',
}

for (let [file, content] of Object.entries(removeContent)) {
    fs.read(directory + file, function (data) {
        if (!data.includes(content)) {
            console.error('The content to remove is not found in ' + directory + file);
            return;
        }
        data = data.replace(content, '');
        const oldData = fs.readSync('./temp/' + file);
        if (data === oldData) {
            fs.moveSync('./temp/' + file, directory + file);
            console.log(directory + file + ' not modified');
        } else {
            fs.write(directory + file, data);
        }
    });
}