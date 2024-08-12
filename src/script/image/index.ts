import { ImageSessionTypes } from '../module/image/session_type';
import { ServerRequestKey, ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { setUpSessionAuthentication } from '../module/server/session_authentication';
import { setTitle } from '../module/dom/document/title/set';
import { getSessionStorage } from '../module/session_storage/get';
import { clearSessionStorage } from '../module/session_storage/clear';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/message/param/invalid_response';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { importModule } from '../module/import_module';
import { TOP_URI } from '../module/env/uri';
import { getHighResTimestamp } from '../module/hi_res_timestamp';

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

    const uri = sessionType === ImageSessionTypes.MEDIA ? 'get_image' : 'get_news_image';
    setUpSessionAuthentication(sessionCredential, getHighResTimestamp());
    setTitle(title);

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );

    const serverRequest = sendServerRequest(uri, {
        [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }

            const currentPgid = pgid;
            const asyncModule = await asyncModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default(baseURL, fileName, serverRequest[ServerRequestKey.REQUEST_START_TIME]);
            showPage();
        },
        [ServerRequestOptionKey.CONTENT]: sessionCredential,
        [ServerRequestOptionKey.SHOW_SESSION_ENDED_MESSAGE]: true,
        [ServerRequestOptionKey.TIMEOUT]: 30000,
    });
}
