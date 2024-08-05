import { ServerRequestOptionProp, parseResponse, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import { changeURL, clearSessionStorage, getHash, getURI } from '../module/dom/document';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import * as AllNewsInfo from '../module/type/AllNewsInfo';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { NewsInfoKey, parseNewsInfo } from '../module/type/NewsInfo';
import { importModule } from '../module/import_module';
import { NEWS_ROOT_URI } from '../module/env/uri';
import { buildURLForm } from '../module/common/pure';

let offloadModule: (() => void) | null = null;

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
    const allNewsModulePromise = import(
        /* webpackExports: ["default", "offload"] */
        './all_news'
    );
    sendServerRequest('get_all_news', {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            const currentPgid = pgid;
            const allNewsModule = await importModule(allNewsModulePromise);
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

    const newsModulePromise = import(
        /* webpackExports: ["default", "offload"] */
        './news'
    );

    const logoutParam = buildURLForm({
        news: newsID,
        hash: getHash(),
    });
    sendServerRequest('get_news', {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            const parsedResponse = parseResponse(response, parseNewsInfo);
            const currentPgid = pgid;
            const newsModule = await importModule(newsModulePromise);
            if (pgid !== currentPgid) {
                return;
            }
            offloadModule = newsModule.offload;
            showPage();
            setUpSessionAuthentication(parsedResponse[NewsInfoKey.CREDENTIAL], logoutParam);
            newsModule.default(parsedResponse, newsID);
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ id: newsID }),
        [ServerRequestOptionProp.LOGOUT_PARAM]: logoutParam,
    });
}

function getNewsID(): string | null {
    return getURI().substring(NEWS_ROOT_URI.length);
}

export function offload() {
    if (offloadModule !== null) {
        offloadModule();
        offloadModule = null;
    }
}
