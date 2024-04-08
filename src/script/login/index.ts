import {
    TOP_URL,
} from '../module/env/constant';
import {
    authenticate,
} from '../module/server';
import {
    clearSessionStorage,
} from '../module/dom';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { addTimeout } from '../module/timer';
import { importModule } from '../module/import_module';

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
            const asyncModule = await importModule(asyncModulePromise);
            if (currentPgid !== pgid) {
                return;
            }
            showPage();
            asyncModule.default(importApprovedCallback());
        }
    });
}