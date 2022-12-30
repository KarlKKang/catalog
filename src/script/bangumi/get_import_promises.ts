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
    '../../../custom_modules/hls.js'
)>;
export type VideojsImportPromise = Promise<typeof import(
    /* webpackExports: ["default"] */
    'video.js'
)>;
export type DashjsImportPromise = Promise<typeof import(
    /* webpackExports: ["default"] */
    'dashjs'
)>;

type AllPromises = {
    updatePage: UpdatePageImportPromise;
    image: ImageImportPromise;
    audio: AudioImportPromise;
    video: VideoImportPromise;
    lazyload: LazyloadImportPromise;
    hls: HlsImportPromise;
    videojs: VideojsImportPromise;
    dashjs: DashjsImportPromise;
};

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
            '../../../custom_modules/hls.js' // This includes a temporary bug fix for encrypted mp3 buffer timestamp.
        ),
        videojs: import(
            /* webpackExports: ["default"] */
            'video.js'
        ),
        dashjs: import(
            /* webpackExports: ["default"] */
            'dashjs'
        )
    };
}