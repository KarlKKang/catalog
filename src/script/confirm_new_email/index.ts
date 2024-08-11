import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { getSearchParam } from '../module/dom/location';
import { clearSessionStorage } from '../module/session_storage/clear';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { invalidResponse } from '../module/server/message';
import { importModule } from '../module/import_module';
import { LOGIN_URI } from '../module/env/uri';
import { buildURLForm } from '../module/http_form';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const getAsyncModulePromise = () => importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );

    const runAsyncModule = async (asyncModulePromise: ReturnType<typeof getAsyncModulePromise>, param: string) => {
        const currentPgid = pgid;
        const asyncModule = await asyncModulePromise;
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
            redirect(LOGIN_URI, true);
        }
        return;
    }

    const asyncModulePromise = getAsyncModulePromise();
    sendServerRequest('change_email', {
        [ServerRequestOptionKey.CALLBACK]: (response: string) => {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'APPROVED') {
                runAsyncModule(asyncModulePromise, param);
            } else {
                showMessage(invalidResponse());
            }
        },
        [ServerRequestOptionKey.CONTENT]: buildURLForm({ p: param }),
    });
}
