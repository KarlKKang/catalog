import { ServerRequestKey, ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { setUpSessionAuthentication } from '../module/server/session_authentication';
import { parseResponse } from '../module/server/parse_response';
import { getURI } from '../module/dom/location/get/uri';
import { setHistoryState } from '../module/dom/location/set/history_state';
import { type ShowPageFunc } from '../module/global/type';
import { redirectSameOrigin } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import * as AllNewsInfo from '../module/type/AllNewsInfo';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { NewsInfoKey, parseNewsInfo } from '../module/type/NewsInfo';
import { importModule } from '../module/import_module';
import { NEWS_ROOT_URI } from '../module/env/uri';
import { buildHttpForm } from '../module/string/http_form/build';
import { setOgUrl } from '../module/dom/document/og/url/set';

export default function (showPage: ShowPageFunc) {
    setOgUrl(NEWS_ROOT_URI);
    const newsID = getNewsID();
    if (newsID === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(newsID)) {
        if (getURI() !== NEWS_ROOT_URI) {
            setHistoryState(NEWS_ROOT_URI, true);
        }
        getAllNews(showPage);
    } else {
        getNews(newsID, showPage);
    }
}

function getAllNews(showPage: ShowPageFunc): void {
    addNavBar(NavBarPage.NEWS);
    const allNewsModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './all_news',
        ),
    );
    sendServerRequest('get_all_news', {
        [ServerRequestOptionKey.CALLBACK]: async function (response: string) {
            const currentPgid = pgid;
            const allNewsModule = await allNewsModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            showPage();
            allNewsModule.default(parseResponse(response, AllNewsInfo.parseAllNewsInfo));
        },
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ pivot: 0 }),
        [ServerRequestOptionKey.METHOD]: 'GET',
    });
}

function getNews(newsID: string, showPage: ShowPageFunc): void {
    addNavBar(NavBarPage.NEWS, () => {
        redirectSameOrigin(NEWS_ROOT_URI);
    });

    const newsModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './news',
        ),
    );

    const serverRequest = sendServerRequest('get_news', {
        [ServerRequestOptionKey.CALLBACK]: async function (response: string) {
            const parsedResponse = parseResponse(response, parseNewsInfo);
            const currentPgid = pgid;
            const newsModule = await newsModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            showPage();
            const startTime = serverRequest[ServerRequestKey.REQUEST_START_TIME];
            setUpSessionAuthentication(parsedResponse[NewsInfoKey.CREDENTIAL], startTime);
            newsModule.default(parsedResponse, newsID, startTime);
        },
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ id: newsID }),
        [ServerRequestOptionKey.TIMEOUT]: 30000,
    });
}

function getNewsID(): string | null {
    return getURI().substring(NEWS_ROOT_URI.length);
}
