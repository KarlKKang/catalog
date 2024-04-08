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
import { emailAlreadyRegistered } from './shared';

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

    const param = getURLParam('p');
    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            runAsyncModule(getAsyncModulePromise(), 'test');
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    const asyncModulePromise = getAsyncModulePromise();
    sendServerRequest('register', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'ALREADY REGISTERED') {
                showMessage(emailAlreadyRegistered);
            } else if (response === 'APPROVED') {
                runAsyncModule(asyncModulePromise, param);
            } else {
                showMessage(invalidResponse());
            }
        },
        [ServerRequestOptionProp.CONTENT]: 'p=' + param,
    });
}