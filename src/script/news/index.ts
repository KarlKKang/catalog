import { ServerRequestOptionProp, parseResponse, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import {
    getHash,
    clearSessionStorage,
    getBaseURL,
    changeURL,
} from '../module/dom';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { NEWS_TOP_URL } from './helper';
import * as AllNewsInfo from '../module/type/AllNewsInfo';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { NewsInfoKey, parseNewsInfo } from '../module/type/NewsInfo';
import { importModule } from '../module/import_module';

let offloadModule: (() => void) | null = null;

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const newsID = getNewsID();
    if (newsID === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(newsID)) {
        if (getBaseURL() !== NEWS_TOP_URL) {
            changeURL(NEWS_TOP_URL, true);
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
    sendServerRequest('get_all_news?pivot=0', {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            const currentPgid = pgid;
            const allNewsModule = await importModule(allNewsModulePromise);
            if (pgid !== currentPgid) {
                return;
            }
            showPage();
            allNewsModule.default(parseResponse(response, AllNewsInfo.parseAllNewsInfo));
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

function getNews(newsID: string, showPage: ShowPageFunc): void {
    addNavBar(NavBarPage.NEWS, () => {
        redirect(NEWS_TOP_URL);
    });

    const newsModulePromise = import(
        /* webpackExports: ["default", "offload"] */
        './news'
    );

    const hash = getHash();
    const logoutParam = 'news=' + newsID + (hash === '' ? '' : ('&hash=' + hash));
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
        [ServerRequestOptionProp.CONTENT]: 'id=' + newsID,
        [ServerRequestOptionProp.LOGOUT_PARAM]: logoutParam
    });
}

function getNewsID(): string | null {
    const start = NEWS_TOP_URL.length;
    return getBaseURL().substring(start);
}

export function offload() {
    if (offloadModule !== null) {
        offloadModule();
        offloadModule = null;
    }
}