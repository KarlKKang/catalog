import {
    APIRequestOptionKey,
    sendAPIRequest,
} from '../module/api/request';
import { type ShowPageFunc } from '../module/global/type';
import { redirectSameOrigin } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import { addTimeout } from '../module/timer/add/timeout';
import { importModule } from '../module/import_module';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/message/param/invalid_response';
import { removeTimeout } from '../module/timer/remove/timeout';
import { getForwardURL } from './helper';

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
    sendAPIRequest('get_authentication_state', {
        [APIRequestOptionKey.CALLBACK]: async (response: string) => {
            if (response === 'APPROVED') {
                redirectSameOrigin(getForwardURL(), true);
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
