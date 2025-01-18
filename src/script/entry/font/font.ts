import { max, min } from '../../module/math';
import { addTimeoutNative } from '../../module/timer/add/native/timeout';

const fontImporters = [
    () => import('./jp'),
    () => import('./en_and_symbol'),
    () => import('./tc'),
    () => import('./sc'),
];

export function importFonts() {
    for (const importer of fontImporters) {
        importFontHelper(importer, 0);
    }
}

function importFontHelper(importer: () => Promise<any>, delay: number) {
    addTimeoutNative(async () => {
        try {
            await importer();
        } catch (e) {
            importFontHelper(importer, min(5000, max(500, delay * 2)));
            throw e;
        }
    }, delay);
}
