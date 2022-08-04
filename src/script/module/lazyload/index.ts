import * as message from '../message';
import type {default as LazyloadInitialize} from './lazyload';
import type {default as ImageLoader} from '../image_loader';

export default async function () {
    var lazyloadInitialize: typeof LazyloadInitialize;
    var imageLoader: typeof ImageLoader;

    try {
        [{default: lazyloadInitialize}, {default: imageLoader}] = await Promise.all([
            import(
                /* webpackChunkName: "lazyload" */
                /* webpackExports: ["default"] */
                './lazyload'
            ),
            import(
                /* webpackChunkName: "image_loader" */
                /* webpackExports: ["default"] */
                '../image_loader'
            ),
        ]);
    } catch (e) {
        message.show(message.template.param.moduleImportError(e));
    }

    return function () {
        lazyloadInitialize(imageLoader);
    };
}