import { pgid } from './global';
import { showMessage } from './message';
import { MessageParamKey } from './message/type';
import { defaultErrorSuffix } from './text/default_error/suffix';
import { addTimeout } from './timer/add/timeout';

export async function importModule<T>(importPromiseGenerator: () => Promise<T>) {
    return importModuleHelper(importPromiseGenerator);
}

async function importModuleHelper<T>(importPromiseGenerator: () => Promise<T>, retryCount = 5, retryTimeout = 500) {
    const currentPgid = pgid;
    try {
        return await importPromiseGenerator();
    } catch (e) {
        if (currentPgid === pgid) {
            retryCount--;
            if (retryCount >= 0) {
                console.error(e);
                return new Promise<T>((resolve) => {
                    addTimeout(() => {
                        resolve(importModuleHelper(importPromiseGenerator, retryCount, retryTimeout * 2));
                    }, retryTimeout);
                });
            }
            showMessage({
                [MessageParamKey.MESSAGE]: 'ページの読み込みに失敗しました。再読み込みをお試しください。' + defaultErrorSuffix,
            });
        }
        throw e;
    }
}
