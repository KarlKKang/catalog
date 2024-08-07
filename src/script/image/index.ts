import {
    SessionTypes,
} from '../module/common';
import { ServerRequestOptionProp, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import { clearSessionStorage, getSessionStorage, setTitle } from '../module/dom/document';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { importModule } from '../module/import_module';
import { TOP_URI } from '../module/env/uri';

let offloadAsyncModule: (() => void) | null = null;

export default function (showPage: ShowPageFunc) {
    const baseURL = getSessionStorage('base-url');
    const fileName = getSessionStorage('file-name');
    const title = getSessionStorage('title');
    const sessionCredential = getSessionStorage('session-credential');
    const sessionType = getSessionStorage('session-type');

    clearSessionStorage();

    if (baseURL === null || fileName === null || title === null || sessionCredential === null || sessionType === null) {
        redirect(TOP_URI, true);
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

            const currentPgid = pgid;
            const asyncModule = await importModule(asyncModulePromise);
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