import { default as importLazyload } from '../module/lazyload';

type UpdatePageImportPromise = Promise<typeof import(
    /* webpackExports: ["default"] */
    './update_page'
)>;
export type ImageImportPromise = Promise<typeof import(
    /* webpackExports: ["default"] */
    './image'
)>;
export type AudioImportPromise = Promise<typeof import(
    /* webpackExports: ["default"] */
    './audio'
)>;
export type VideoImportPromise = Promise<typeof import(
    /* webpackExports: ["default"] */
    './video'
)>;
export type LazyloadImportPromise = ReturnType<typeof importLazyload>;
export type HlsImportPromise = Promise<typeof import(
    /* webpackExports: ["default"] */
    'hls.js'
)>;

type AllPromises = {
    updatePage: UpdatePageImportPromise,
    image: ImageImportPromise,
    audio: AudioImportPromise,
    video: VideoImportPromise,
    lazyload: LazyloadImportPromise,
    hls: HlsImportPromise
}

export default function (): AllPromises {
    return {
        updatePage: import(
            /* webpackExports: ["default"] */
            './update_page'
        ),
        image: import(
            /* webpackExports: ["default"] */
            './image'
        ),
        audio: import(
            /* webpackExports: ["default"] */
            './audio'
        ),
        video: import(
            /* webpackExports: ["default"] */
            './video'
        ),
        lazyload: importLazyload(),
        hls: import(
            /* webpackExports: ["default"] */
            'hls.js'
        )
    };
}