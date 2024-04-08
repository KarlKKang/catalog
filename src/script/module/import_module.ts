import { pgid } from './global';
import { showMessage } from './message';
import { moduleImportError } from './message/param';

export async function importModule<T>(importPromise: Promise<T>) {
    const currentPgid = pgid;
    let module: T;
    try {
        module = await importPromise;
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage(moduleImportError);
        }
        throw e;
    }
    return module;
}