import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allFileReaders } from './internal/all_file_readers';

export function offloadFileReader() {
    for (const fileReader of allFileReaders) {
        removeAllEventListeners(fileReader);
        fileReader.abort();
    }
    allFileReaders.clear();
    if (DEVELOPMENT) {
        console.log('All FileReaders offloaded.');
    }
}
