import { pgid } from './global';
import { showMessage } from './message';
import { MessageParamKey } from './message/type';
import { defaultErrorSuffix } from './text/message/body';

export async function importModule<T>(importPromise: Promise<T>) {
    const currentPgid = pgid;
    let module: T;
    try {
        module = await importPromise;
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage({
                [MessageParamKey.MESSAGE]: 'ページの読み込みに失敗しました。再読み込みをお試しください。' + defaultErrorSuffix,
            });
        }
        throw e;
    }
    return module;
}
