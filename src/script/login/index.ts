import {
    ServerRequestOptionProp,
    sendServerRequest,
} from '../module/server';
import { clearSessionStorage } from '../module/dom/session_storage';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { addTimeout } from '../module/timer';
import { importModule } from '../module/import_module';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import { TOP_URI } from '../module/env/uri';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    let approvedCallbackPromise: Promise<typeof import(
        /* webpackExports: ["default"] */
        './approved_callback'
    )> | null = null;
    const importApprovedCallback = () => {
        if (approvedCallbackPromise !== null) {
            return approvedCallbackPromise;
        }
        approvedCallbackPromise = import(
            /* webpackExports: ["default"] */
            './approved_callback'
        );
        return approvedCallbackPromise;
    };
    addTimeout(importApprovedCallback, 1000);

    const asyncModulePromise = import(
        /* webpackExports: ["default"] */
        './async'
    );
    sendServerRequest('get_authentication_state', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            if (response === 'APPROVED') {
                redirect(TOP_URI, true);
            } else if (response === 'FAILED') {
                const currentPgid = pgid;
                const asyncModule = await importModule(asyncModulePromise);
                if (currentPgid !== pgid) {
                    return;
                }
                showPage();
                asyncModule.default(importApprovedCallback());
            } else {
                showMessage(invalidResponse());
            }
        },
    });
}
