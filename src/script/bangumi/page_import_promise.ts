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
}
