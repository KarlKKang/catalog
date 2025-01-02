import {
    ServerRequestOptionKey,
    sendServerRequest,
} from '../module/server/request';
import { type ShowPageFunc } from '../module/global/type';
import { redirectSameOrigin } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import { addTimeout } from '../module/timer/add/timeout';
import { importModule } from '../module/import_module';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/message/param/invalid_response';
import { TOP_URI } from '../module/env/uri';
import { removeTimeout } from '../module/timer/remove/timeout';

export default function (showPage: ShowPageFunc) {
    let approvedCallbackImportPromise: Promise<typeof import(
        /* webpackExports: ["default"] */
        './approved_callback'
    )> | null = null;
    const importApprovedCallback = () => importModule(
        () => import(
            /* webpackExports: ["default"] */
            './approved_callback',
        ),
    );
    const approvedCallbackImportTimeout = addTimeout(() => {
        approvedCallbackImportPromise = importApprovedCallback();
    }, 1000);

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async',
        ),
    );
    sendServerRequest('get_authentication_state', {
        [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
            if (response === 'APPROVED') {
                redirectSameOrigin(TOP_URI, true);
            } else if (response === 'FAILED') {
                const currentPgid = pgid;
                const asyncModule = await asyncModulePromise;
                if (currentPgid !== pgid) {
                    return;
                }
                showPage();
                if (approvedCallbackImportPromise === null) {
                    removeTimeout(approvedCallbackImportTimeout);
                    approvedCallbackImportPromise = importApprovedCallback();
                }
                asyncModule.default(approvedCallbackImportPromise);
            } else {
                showMessage(invalidResponse());
            }
        },
    });
}
