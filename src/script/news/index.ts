import { ServerRequestOptionProp, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import {
    getHash,
    clearSessionStorage,
    getBaseURL,
    changeURL,
} from '../module/dom';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import * as NewsInfo from '../module/type/NewsInfo';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import { pgid, redirect } from '../module/global';
import { importLazyload } from '../module/lazyload';
import { NEWS_TOP_URL } from './helper';
import * as AllNewsInfo from '../module/type/AllNewsInfo';
import { moduleImportError } from '../module/message/param';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';

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
    const allNewsModuleImport = import(
        /* webpackExports: ["default", "offload"] */
        './all_news'
    );
    sendServerRequest('get_all_news?pivot=0', {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            let parsedResponse: AllNewsInfo.AllNewsInfo;
            try {
                parsedResponse = JSON.parse(response);
                AllNewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }

            const currentPgid = pgid;
            let allNewsModule: Awaited<typeof allNewsModuleImport>;
            try {
                allNewsModule = await allNewsModuleImport;
            } catch (e) {
                if (pgid === currentPgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }
            if (pgid !== currentPgid) {
                return;
            }
            showPage();
            allNewsModule.default(parsedResponse);
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

function getNews(newsID: string, showPage: ShowPageFunc): void {
    addNavBar(NavBarPage.NEWS, () => {
        redirect(NEWS_TOP_URL);
    });

    const lazyloadImportPromise = importLazyload();
    const newsModuleImport = import(
        /* webpackExports: ["default", "offload"] */
        './news'
    );

    const hash = getHash();
    const logoutParam = 'news=' + newsID + (hash === '' ? '' : ('&hash=' + hash));
    sendServerRequest('get_news', {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            let parsedResponse: NewsInfo.NewsInfo;
            try {
                parsedResponse = JSON.parse(response);
                NewsInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }

            const currentPgid = pgid;
            let newsModule: Awaited<typeof newsModuleImport>;
            try {
                newsModule = await newsModuleImport;
            } catch (e) {
                if (pgid === currentPgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }
            if (pgid !== currentPgid) {
                return;
            }
            offloadModule = newsModule.offload;
            showPage();
            setUpSessionAuthentication(parsedResponse.credential, logoutParam);
            newsModule.default(parsedResponse, lazyloadImportPromise, newsID);
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