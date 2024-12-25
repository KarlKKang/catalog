import { importModule } from '../module/import_module';

export let imageImportPromise: Promise<typeof import(
    /* webpackExports: ["default"] */
    './image'
)>;
export let audioImportPromise: Promise<typeof import(
    /* webpackExports: ["default"] */
    './audio'
)>;
export let videoImportPromise: Promise<typeof import(
    /* webpackExports: ["default"] */
    './video'
)>;
export function importAllPageModules() {
    imageImportPromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './image',
        ),
    );
    audioImportPromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './audio',
        ),
    );
    videoImportPromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './video',
        ),
    );
}
