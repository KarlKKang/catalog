import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { clearSessionStorage } from '../module/session_storage/clear';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import { pgid, type ShowPageFunc } from '../module/global';
import { importModule } from '../module/import_module';
import { buildURLForm } from '../module/http_form';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );
    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }
            const currentPgid = pgid;
            const asyncModule = await asyncModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default();
            showPage();
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: JSON.stringify({ command: 'authenticate' }) }),
    });
}
