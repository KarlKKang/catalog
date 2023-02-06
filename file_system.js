import fs from 'fs';

export function write(file, data) {
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
};

export function read(file, callback) {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        callback(data);
    });
};

export function readSync(file) {
    return fs.readFileSync(file, 'utf8');
}

export function mkdir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}