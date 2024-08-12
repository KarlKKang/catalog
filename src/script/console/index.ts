import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { clearSessionStorage } from '../module/session_storage/clear';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/message/param/invalid_response';
import { pgid, type ShowPageFunc } from '../module/global';
import { importModule } from '../module/import_module';
import { buildHttpForm } from '../module/string/http_form/build';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );
    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
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
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ p: JSON.stringify({ command: 'authenticate' }) }),
    });
}
