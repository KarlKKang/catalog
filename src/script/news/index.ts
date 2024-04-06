import { ServerRequestOptionProp, parseResponse, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import {
    getHash,
    clearSessionStorage,
    getBaseURL,
    changeURL,
} from '../module/dom';
import { showMessage } from '../module/message';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { importLazyload } from '../module/lazyload';
import { NEWS_TOP_URL } from './helper';
import * as AllNewsInfo from '../module/type/AllNewsInfo';
import { moduleImportError } from '../module/message/param';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { NewsInfoKey, parseNewsInfo } from '../module/type/NewsInfo';

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
            const currentPgid = pgid;
            let allNewsModule: Awaited<typeof allNewsModuleImport>;
            try {
                allNewsModule = await allNewsModuleImport;
            } catch (e) {
                if (pgid === currentPgid) {
                    showMessage(moduleImportError);
                }
                throw e;
            }
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

    const lazyloadImportPromise = importLazyload();
    const newsModuleImport = import(
        /* webpackExports: ["default", "offload"] */
        './news'
    );

    const hash = getHash();
    const logoutParam = 'news=' + newsID + (hash === '' ? '' : ('&hash=' + hash));
    sendServerRequest('get_news', {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            const parsedResponse = parseResponse(response, parseNewsInfo);
            const currentPgid = pgid;
            let newsModule: Awaited<typeof newsModuleImport>;
            try {
                newsModule = await newsModuleImport;
            } catch (e) {
                if (pgid === currentPgid) {
                    showMessage(moduleImportError);
                }
                throw e;
            }
            if (pgid !== currentPgid) {
                return;
            }
            offloadModule = newsModule.offload;
            showPage();
            setUpSessionAuthentication(parsedResponse[NewsInfoKey.CREDENTIAL], logoutParam);
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