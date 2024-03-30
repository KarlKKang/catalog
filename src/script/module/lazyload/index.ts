import { pgid } from '../global';
import { showMessage } from '../message';
import { moduleImportError } from '../message/param';

let lazyload: Awaited<typeof import(
    './lazyload'
)> | null = null;

let imageLoader: Awaited<typeof import(
    '../image_loader'
)> | null = null;

export async function importLazyload() {
    if (lazyload !== null && imageLoader !== null) {
        return lazyload;
    }
    const currentPgid = pgid;
    try {
        [lazyload, imageLoader] = await Promise.all([
            import(
                /* webpackExports: ["default", "unobserveAll", "attachImageLoader", "setCredential"] */
                './lazyload'
            ),
            import(
                /* webpackExports: ["default", "clearAllImageEvents"] */
                '../image_loader'
            )
        ]);
    } catch (e) {
        if (pgid === currentPgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
    lazyload.attachImageLoader(imageLoader.default);
    return lazyload;
}

export function unloadLazyload() {
    lazyload?.unobserveAll();
    imageLoader?.clearAllImageEvents();
}