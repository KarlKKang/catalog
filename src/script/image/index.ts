import { ImageSessionTypes } from '../module/image/session_type';
import { APIRequestKey, APIRequestOptionKey, sendAPIRequest } from '../module/server/request';
import { setUpSessionAuthentication } from '../module/server/session_authentication';
import { setTitle } from '../module/dom/document/title';
import { getSessionStorage } from '../module/session_storage/get';
import { clearSessionStorage } from '../module/session_storage/clear';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/message/param/invalid_response';
import { type ShowPageFunc } from '../module/global/type';
import { redirectSameOrigin } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import { importModule } from '../module/import_module';
import { IMAGE_URI } from '../module/env/uri';
import { getHighResTimestamp } from '../module/time/hi_res';
import { setOgUrl } from '../module/dom/document/og/url/set';
import { setHistoryState } from '../module/dom/location/set/history_state';
import { buildURI } from '../module/string/uri/build';
import { buildHttpForm } from '../module/string/http_form/build';
import { getSearchParam } from '../module/dom/location/get/search_param';
import { notFound } from '../module/message/param/not_found';

export default function (showPage: ShowPageFunc) {
    const baseURL = getSessionStorage('base-url');
    const fileName = getSessionStorage('file-name');
    const title = getSessionStorage('title');
    const sessionCredential = getSessionStorage('session-credential');
    const sessionType = getSessionStorage('session-type');
    const canonicalURL = getSessionStorage('canonical-url');
    const originURL = getSessionStorage('origin');

    clearSessionStorage();

    if (
        baseURL === null
        || fileName === null
        || title === null
        || sessionCredential === null
        || sessionType === null
        || canonicalURL === null
        || originURL === null
    ) {
        const originURLQuery = getSearchParam('origin');
        if (originURLQuery === null) {
            showMessage(notFound(true));
        } else {
            redirectSameOrigin(originURLQuery, true);
        }
        return;
    }

    const uri = sessionType === ImageSessionTypes.MEDIA ? 'get_image' : 'get_news_image';
    setUpSessionAuthentication(sessionCredential, getHighResTimestamp(), originURL);
    setTitle(title);
    setOgUrl(canonicalURL);
    setHistoryState(buildURI(
        IMAGE_URI,
        buildHttpForm({ origin: originURL }),
    ), true);

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async',
        ),
    );

    const serverRequest = sendAPIRequest(uri, {
        [APIRequestOptionKey.CALLBACK]: async (response: string) => {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse(originURL));
                return;
            }

            const currentPgid = pgid;
            const asyncModule = await asyncModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default(baseURL, fileName, serverRequest[APIRequestKey.REQUEST_START_TIME], originURL);
            showPage();
        },
        [APIRequestOptionKey.CONTENT]: sessionCredential,
        [APIRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
        [APIRequestOptionKey.TIMEOUT]: 30000,
        [APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR]: originURL,
    });
}
