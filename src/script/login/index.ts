import {
    TOP_URL,
} from '../module/env/constant';
import {
    authenticate,
} from '../module/server';
import {
    clearSessionStorage,
} from '../module/dom';
import { showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { addTimeout } from '../module/timer';

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

    authenticate({
        successful: () => {
            redirect(TOP_URL, true);
        },
        failed: async () => {
            const currentPgid = pgid;
            let asyncModule: Awaited<typeof asyncModulePromise>;
            try {
                asyncModule = await asyncModulePromise;
            } catch (e) {
                if (pgid === currentPgid) {
                    showMessage(moduleImportError);
                }
                throw e;
            }
            showPage();
            asyncModule.default(importApprovedCallback());
        }
    });
}