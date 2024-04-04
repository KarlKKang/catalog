import { pgid } from '../global';
import { showMessage } from '../message';
import { moduleImportError } from '../message/param';
import type { default as ImageLoader, offload as ImageLoaderOffload } from '../image_loader/image_loader';

let imageLoader: typeof ImageLoader | null = null;
let imageLoaderOffload: typeof ImageLoaderOffload | null = null;

export async function importImageLoader() {
    if (imageLoader !== null) {
        return imageLoader;
    }
    const currentPgid = pgid;
    try {
        ({ default: imageLoader, offload: imageLoaderOffload } = await import(
            '../image_loader/image_loader'
        ));
    } catch (e) {
        if (pgid === currentPgid) {
            showMessage(moduleImportError);
        }
        throw e;
    }
    return imageLoader;
}

export function offloadImageLoader() {
    imageLoaderOffload?.();
}