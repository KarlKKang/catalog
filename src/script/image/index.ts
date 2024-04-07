import {
    TOP_URL,
} from '../module/env/constant';
import {
    SessionTypes,
} from '../module/common';
import { ServerRequestOptionProp, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import {
    setTitle,
    getSessionStorage,
    clearSessionStorage,
} from '../module/dom';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { moduleImportError } from '../module/message/param';

let offloadAsyncModule: (() => void) | null = null;

export default function (showPage: ShowPageFunc) {
    const baseURL = getSessionStorage('base-url');
    const fileName = getSessionStorage('file-name');
    const title = getSessionStorage('title');
    const sessionCredential = getSessionStorage('session-credential');
    const sessionType = getSessionStorage('session-type');

    clearSessionStorage();

    if (baseURL === null || fileName === null || title === null || sessionCredential === null || sessionType === null) {
        redirect(TOP_URL, true);
        return;
    }

    const uri = sessionType === SessionTypes.MEDIA ? 'get_image' : 'get_news_image';
    setUpSessionAuthentication(sessionCredential);
    setTitle(title);

    const asyncModulePromise = import(
        /* webpackExports: ["default", "offload"] */
        './async'
    );

    sendServerRequest(uri, {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }

            let asyncModule: Awaited<typeof asyncModulePromise>;
            const currentPgid = pgid;
            try {
                asyncModule = await asyncModulePromise;
            } catch (e) {
                if (pgid === currentPgid) {
                    showMessage(moduleImportError);
                }
                throw e;
            }
            if (pgid !== currentPgid) {
                return;
            }
            offloadAsyncModule = asyncModule.offload;
            asyncModule.default(baseURL, fileName);
            showPage();
        },
        [ServerRequestOptionProp.CONTENT]: sessionCredential,
        [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
    });
}

export function offload() {
    if (offloadAsyncModule !== null) {
        offloadAsyncModule();
        offloadAsyncModule = null;
    }
}