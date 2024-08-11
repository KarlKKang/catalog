import { ServerRequestKey, ServerRequestOptionProp, parseResponse, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import { changeURL, getHash, getURI } from '../module/dom/document';
import { clearSessionStorage } from '../module/session_storage/clear';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import * as AllNewsInfo from '../module/type/AllNewsInfo';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { NewsInfoKey, parseNewsInfo } from '../module/type/NewsInfo';
import { importModule } from '../module/import_module';
import { NEWS_ROOT_URI } from '../module/env/uri';
import { buildURLForm } from '../module/http_form';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const newsID = getNewsID();
    if (newsID === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(newsID)) {
        if (getURI() !== NEWS_ROOT_URI) {
            changeURL(NEWS_ROOT_URI, true);
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
            './all_news'
        ),
    );
    sendServerRequest('get_all_news', {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            const currentPgid = pgid;
            const allNewsModule = await allNewsModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            showPage();
            allNewsModule.default(parseResponse(response, AllNewsInfo.parseAllNewsInfo));
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ pivot: 0 }),
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

function getNews(newsID: string, showPage: ShowPageFunc): void {
    addNavBar(NavBarPage.NEWS, () => {
        redirect(NEWS_ROOT_URI);
    });

    const newsModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './news'
        ),
    );

    const logoutParam = buildURLForm({
        news: newsID,
        hash: getHash(),
    });
    const serverRequest = sendServerRequest('get_news', {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            const parsedResponse = parseResponse(response, parseNewsInfo);
            const currentPgid = pgid;
            const newsModule = await newsModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            showPage();
            const startTime = serverRequest[ServerRequestKey.REQUEST_START_TIME];
            setUpSessionAuthentication(parsedResponse[NewsInfoKey.CREDENTIAL], startTime, logoutParam);
            newsModule.default(parsedResponse, newsID, startTime);
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ id: newsID }),
        [ServerRequestOptionProp.LOGOUT_PARAM]: logoutParam,
        [ServerRequestOptionProp.TIMEOUT]: 30000,
    });
}

function getNewsID(): string | null {
    return getURI().substring(NEWS_ROOT_URI.length);
}
