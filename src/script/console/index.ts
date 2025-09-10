import { APIRequestOptionKey, sendAPIRequest } from '../module/server/request';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/message/param/invalid_response';
import { type ShowPageFunc } from '../module/global/type';
import { pgid } from '../module/global/pgid';
import { importModule } from '../module/import_module';
import { buildHttpForm } from '../module/string/http_form/build';

export default function (showPage: ShowPageFunc) {
    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async',
        ),
    );
    sendAPIRequest('console', {
        [APIRequestOptionKey.CALLBACK]: async (response: string) => {
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
        [APIRequestOptionKey.CONTENT]: buildHttpForm({ p: JSON.stringify({ command: 'authenticate' }) }),
    });
}
