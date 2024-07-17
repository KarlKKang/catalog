export let nativePlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["Player"] */
    '../module/player/player'
)>;
export let hlsPlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["HlsPlayer"] */
    '../module/player/hls_player'
)>;

export function importAllMediaModules() {
    nativePlayerImportPromise = import(
        /* webpackExports: ["Player"] */
        '../module/player/player'
    );
    hlsPlayerImportPromise = import(
        /* webpackExports: ["HlsPlayer"] */
        '../module/player/hls_player'
    );
}