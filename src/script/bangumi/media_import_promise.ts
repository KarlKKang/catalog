import { importModule } from '../module/import_module';

export let nativePlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["Player"] */
    '../module/player/player'
)>;
export let hlsPlayerImportPromise: Promise<typeof import(
    /* webpackExports: ["HlsPlayer"] */
    '../module/player/hls_player'
)>;

export function importAllMediaModules() {
    nativePlayerImportPromise = importModule(
        () => import(
            /* webpackExports: ["Player"] */
            '../module/player/player'
        ),
    );
    hlsPlayerImportPromise = importModule(
        () => import(
            /* webpackExports: ["HlsPlayer"] */
            '../module/player/hls_player'
        ),
    );
}
