import { importModule } from '../module/import_module';

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
export function importAllPageModules() {
    imageImportPromise = importModule(
        () => import(
            /* webpackExports: ["default", "offload"] */
            './image'
        ),
    );
    audioImportPromise = importModule(
        () => import(
            /* webpackExports: ["default", "offload"] */
            './audio'
        ),
    );
    videoImportPromise = importModule(
        () => import(
            /* webpackExports: ["default", "offload"] */
            './video'
        ),
    );
}
