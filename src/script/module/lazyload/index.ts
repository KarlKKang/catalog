import { pgid } from '../global';
import { show as showMessage } from '../message';
import { moduleImportError } from '../message/template/param';

let lazyload: Awaited<typeof import(
    /* webpackExports: ["default", "unobserveAll"] */
    './lazyload'
)> | null = null;

let imageLoader: Awaited<typeof import(
    /* webpackExports: ["default", "clearAllImageEvents"] */
    '../image_loader'
)> | null = null;

export async function lazyloadImport() {
    if (lazyload !== null && imageLoader !== null) {
        return lazyload;
    }
    const currentPgid = pgid;
    try {
        [lazyload, imageLoader] = await Promise.all([
            import(
                /* webpackExports: ["default", "unobserveAll", "attachImageLoader"] */
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