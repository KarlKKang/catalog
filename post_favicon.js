import * as fs from './file_system.js';

const BUILD = process.env.BUILD;

let directory = './dev/';
if (BUILD === 'production') {
    directory = './dist/';
}

const contentsToRemove = {
    'index.html': ['<meta content=%remove% name=theme-color>'],
    'unsupported_browser.html': ['<meta content=%remove% name=theme-color>'],
    'icon/manifest.webmanifest': ['  "theme_color": "%remove%",\n'],
};

for (const [file, contents] of Object.entries(contentsToRemove)) {
    fs.read(directory + file, function (data) {
        for (const content of contents) {
            const newData = data.replaceAll(content, '');
            if (data === newData) {
                console.error('The content to remove is not found in ' + directory + file);
                process.exit(1);
            }
            data = newData;
        }
        const oldData = fs.readSync('./temp/' + file);
        if (data === oldData) {
            fs.moveSync('./temp/' + file, directory + file);
            console.log(directory + file + ' not modified');
        } else {
            fs.write(directory + file, data);
        }
    });
}