import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { clearSessionStorage } from '../module/dom/document';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import { pgid, type ShowPageFunc } from '../module/global';
import { importModule } from '../module/import_module';
import { buildURLForm } from '../module/http_form';

let offloadModule: (() => void) | null = null;

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const asyncModulePromise = import(
        /* webpackExports: ["default"] */
        './async'
    );
    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }
            const currentPgid = pgid;
            const asyncModule = await importModule(asyncModulePromise);
            if (pgid !== currentPgid) {
                return;
            }
            offloadModule = asyncModule.offload;
            asyncModule.default();
            showPage();
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: JSON.stringify({ command: 'authenticate' }) }),
    });
}

export function offload() {
    if (offloadModule !== null) {
        offloadModule();
        offloadModule = null;
    }
}
