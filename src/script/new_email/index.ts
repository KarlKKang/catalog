import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { clearSessionStorage, getSearchParam } from '../module/dom/document';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { invalidResponse } from '../module/server/message';
import { importModule } from '../module/import_module';
import { TOP_URI } from '../module/env/uri';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const getAsyncModulePromise = () => import(
        /* webpackExports: ["default"] */
        './async'
    );
    const runAsyncModule = async (asyncModulePromise: ReturnType<typeof getAsyncModulePromise>, param: string) => {
        const currentPgid = pgid;
        const asyncModule = await importModule(asyncModulePromise);
        if (pgid !== currentPgid) {
            return;
        }
        asyncModule.default(param);
        showPage();
    };

    const param = getSearchParam('p');
    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            runAsyncModule(getAsyncModulePromise(), 'test');
        } else {
            redirect(TOP_URI, true);
        }
        return;
    }

    const asyncModulePromise = getAsyncModulePromise();
    sendServerRequest('verify_email_change', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'APPROVED') {
                runAsyncModule(asyncModulePromise, param);
            } else {
                showMessage(invalidResponse());
            }
        },
        [ServerRequestOptionProp.CONTENT]: 'p=' + param,
    });
}