import { lazyloadImport } from '../module/lazyload';

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
export let lazyloadImportPromise: ReturnType<typeof lazyloadImport>;
export let nativePlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["Player"] */
    '../module/player/player'
)>;
export let hlsPlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["HlsPlayer"] */
    '../module/player/hls_player'
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
    lazyloadImportPromise = lazyloadImport();
    nativePlayerImportPromise = import(
        /* webpackExports: ["Player"] */
        '../module/player/player'
    );
    hlsPlayerImportPromise = import(
        /* webpackExports: ["HlsPlayer"] */
        '../module/player/hls_player'
    );
}