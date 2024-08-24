import { addEventListener } from '../event_listener/add';
import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allFileReaders } from './internal/all_file_readers';

export function newFileReader(): FileReader {
    const fileReader = new FileReader();
    allFileReaders.add(fileReader);
    addEventListener(fileReader, 'loadend', () => {
        allFileReaders.delete(fileReader);
        removeAllEventListeners(fileReader);
        if (DEVELOPMENT) {
            console.log(`FileReader completed. Total FileReaders: ${allFileReaders.size}.`, fileReader);
        }
    });
    return fileReader;
}
