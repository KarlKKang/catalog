import { pgid } from '../global';
import { importImageLoader, offloadImageLoader } from '../image_loader';
import { showMessage } from '../message';
import { moduleImportError } from '../message/param';
import type * as Lazyload from './lazyload';

export const enum LazyloadProp {
    DEFAULT,
    SET_CREDENTIAL,
}

let lazyload: {
    [LazyloadProp.DEFAULT]: typeof Lazyload.default;
    [LazyloadProp.SET_CREDENTIAL]: typeof Lazyload.setCredential;
} | null = null;
let unobserveAll: typeof Lazyload.unobserveAll | null = null;

export async function importLazyload() {
    if (lazyload !== null) {
        return lazyload;
    }
    const imageLoaderImportPromise = importImageLoader();
    let lazyloadDefault: typeof Lazyload.default;
    let attachImageLoader: typeof Lazyload.attachImageLoader;
    let setCredential: typeof Lazyload.setCredential;
    const currentPgid = pgid;
    try {
        ({ default: lazyloadDefault, unobserveAll, attachImageLoader, setCredential } = await import(
            './lazyload'
        ));
    } catch (e) {
        if (pgid === currentPgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
    const imageLoader = await imageLoaderImportPromise;
    attachImageLoader(imageLoader);
    lazyload = {
        [LazyloadProp.DEFAULT]: lazyloadDefault,
        [LazyloadProp.SET_CREDENTIAL]: setCredential,
    };
    return lazyload;
}

export function offloadLazyload() {
    unobserveAll?.();
    offloadImageLoader();
}