export let updatePageImportPromise: Promise<typeof import(
    /* webpackExports: ["default", "offload"] */
    './update_page'
)>;
export let imageImportPromise: Promise<typeof import(
    /* webpackExports: ["default", "offload"] */
    './image'
)>;
export let audioImportPromise: Promise<typeof import(
    /* webpackExports: ["default", "offload"] */
    './audio'
)>;
export let videoImportPromise: Promise<typeof import(
    /* webpackExports: ["default", "offload"] */
    './video'
)>;
export let lazyloadImportPromise: Promise<typeof import(
    /* webpackExports: ["default", "unobserveAll"] */
    '../module/lazyload'
)>;
export let imageLoaderImportPromise: Promise<typeof import(
    /* webpackExports: ["clearAllImageEvents"] */
    '../module/image_loader'
)>;
export let nativePlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["Player"] */
    '../module/player/player'
)>;
export let hlsPlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["HlsPlayer"] */
    '../module/player/hls_player'
)>;
export let videojsPlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["VideojsPlayer"] */
    '../module/player/videojs_player'
)>;

export function importAll() {
    updatePageImportPromise = import(
        /* webpackExports: ["default", "offload"] */
        './update_page'
    );
    imageImportPromise = import(
        /* webpackExports: ["default", "offload"] */
        './image'
    );
    audioImportPromise = import(
        /* webpackExports: ["default", "offload"] */
        './audio'
    );
    videoImportPromise = import(
        /* webpackExports: ["default", "offload"] */
        './video'
    );
    lazyloadImportPromise = import(
        /* webpackExports: ["default", "unobserveAll"] */
        '../module/lazyload'
    );
    imageLoaderImportPromise = import(
        /* webpackExports: ["clearAllImageEvents"] */
        '../module/image_loader'
    );
    nativePlayerImportPromise = import(
        /* webpackExports: ["Player"] */
        '../module/player/player'
    );
    hlsPlayerImportPromise = import(
        /* webpackExports: ["HlsPlayer"] */
        '../module/player/hls_player'
    );
    videojsPlayerImportPromise = import(
        /* webpackExports: ["VideojsPlayer"] */
        '../module/player/videojs_player'
    );
}