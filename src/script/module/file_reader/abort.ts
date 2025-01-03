import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allFileReaders } from './internal/all_file_readers';

export function abortFileReader(fileReader: FileReader) {
    if (allFileReaders.delete(fileReader)) {
        removeAllEventListeners(fileReader);
        fileReader.abort();
        if (ENABLE_DEBUG) {
            console.log(`FileReader aborted. Total FileReaders: ${allFileReaders.size}.`, fileReader);
        }
    } else if (ENABLE_DEBUG) {
        console.error('FileReader not found.', fileReader);
    }
}
