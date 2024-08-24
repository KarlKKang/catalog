import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { allFileReaders } from './internal/all_file_readers';

export function abortFileReader(fileReader: FileReader) {
    if (allFileReaders.delete(fileReader)) {
        removeAllEventListeners(fileReader);
        fileReader.abort();
        if (DEVELOPMENT) {
            console.log(`FileReader aborted. Total FileReaders: ${allFileReaders.size}.`, fileReader);
        }
    } else if (DEVELOPMENT) {
        console.error('FileReader not found.', fileReader);
    }
}
