import { show as showMessage } from '../message';
import { moduleImportError }from '../message/template/param';
import type { default as LazyloadInitialize } from './lazyload';
import type { default as ImageLoader } from '../image_loader';

export default async function () {
    let lazyloadInitialize: typeof LazyloadInitialize;
    let imageLoader: typeof ImageLoader;

    try {
        [{ default: lazyloadInitialize }, { default: imageLoader }] = await Promise.all([
            import(
                /* webpackExports: ["default"] */
                './lazyload'
            ),
            import(
                /* webpackExports: ["default"] */
                '../image_loader'
            ),
        ]);
    } catch (e) {
        showMessage(moduleImportError(e));
    }

    return function () {
        lazyloadInitialize(imageLoader);
    };
}