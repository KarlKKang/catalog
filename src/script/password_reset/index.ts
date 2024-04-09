import {
    LOGIN_URL,
} from '../module/env/constant';
import {
    getURLParam,
} from '../module/common';
import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import {
    clearSessionStorage,
} from '../module/dom';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { invalidResponse } from '../module/server/message';
import { importModule } from '../module/import_module';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const getAsyncModulePromise = () => import(
        /* webpackExports: ["default"] */
        './async'
    );
    const runAsyncModule = async (asyncModulePromise: ReturnType<typeof getAsyncModulePromise>, user: string, signature: string, expires: string) => {
        const currentPgid = pgid;
        const asyncModule = await importModule(asyncModulePromise);
        if (pgid !== currentPgid) {
            return;
        }
        asyncModule.default(user, signature, expires);
        showPage();
    };

    const user = getURLParam('user');
    const signature = getURLParam('signature');
    const expires = getURLParam('expires');

    if (user === null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
        if (DEVELOPMENT) {
            runAsyncModule(getAsyncModulePromise(), 'test', 'test', 'test');
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    if (signature === null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        redirect(LOGIN_URL, true);
        return;
    }

    if (expires === null || !/^[0-9]+$/.test(expires)) {
        redirect(LOGIN_URL, true);
        return;
    }

    const asyncModulePromise = getAsyncModulePromise();
    sendServerRequest('reset_password', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
                return;
            } else if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }
            runAsyncModule(asyncModulePromise, user, signature, expires);
        },
        [ServerRequestOptionProp.CONTENT]: 'user=' + user + '&signature=' + signature + '&expires=' + expires,
    });
}