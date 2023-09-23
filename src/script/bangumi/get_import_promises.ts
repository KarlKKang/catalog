export type UpdatePageImportPromise = Promise<typeof import(
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
export type LazyloadImportPromise = Promise<typeof import(
    /* webpackExports: ["default"] */
    '../module/lazyload'
)>;
export type ImageLoaderImportPromise = Promise<typeof import(
    /* webpackExports: ["clearAllImageEvents"] */
    '../module/image_loader'
)>;
export type NativePlayerImportPromise = Promise<typeof import(
    /* webpackExports: ["Player"] */
    '../module/player/player'
)>;
export type HlsPlayerImportPromise = Promise<typeof import(
    /* webpackExports: ["HlsPlayer"] */
    '../module/player/hls_player'
)>;
export type VideojsPlayerImportPromise = Promise<typeof import(
    /* webpackExports: ["VideojsPlayer"] */
    '../module/player/videojs_player'
)>;

type AllPromises = {
    updatePage: UpdatePageImportPromise;
    image: ImageImportPromise;
    audio: AudioImportPromise;
    video: VideoImportPromise;
    lazyload: LazyloadImportPromise;
    imageLoader: ImageLoaderImportPromise;
    nativePlayer: NativePlayerImportPromise;
    hlsPlayer: HlsPlayerImportPromise;
    videojsPlayer: VideojsPlayerImportPromise;
};

export default function (): AllPromises {
    return {
        updatePage: import(
            /* webpackExports: ["default", "reload", "offload"] */
            './update_page'
        ),
        image: import(
            /* webpackExports: ["default", "reload", "offload"] */
            './image'
        ),
        audio: import(
            /* webpackExports: ["default", "reload", "offload"] */
            './audio'
        ),
        video: import(
            /* webpackExports: ["default", "reload", "offload"] */
            './video'
        ),
        lazyload: import(
            /* webpackExports: ["default", "unobserveAll"] */
            '../module/lazyload'
        ),
        imageLoader: import(
            /* webpackExports: ["clearAllImageEvents"] */
            '../module/image_loader'
        ),
        nativePlayer: import(
            /* webpackExports: ["Player"] */
            '../module/player/player'
        ),
        hlsPlayer: import(
            /* webpackExports: ["HlsPlayer"] */
            '../module/player/hls_player'
        ),
        videojsPlayer: import(
            /* webpackExports: ["VideojsPlayer"] */
            '../module/player/videojs_player'
        )
    };
}