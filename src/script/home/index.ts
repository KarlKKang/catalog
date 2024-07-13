import {
    scrollToTop,
} from '../module/common';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import { changeURL, clearSessionStorage, w } from '../module/dom/document';
import { isbot } from 'isbot';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { parseSeriesInfo } from '../module/type/SeriesInfo';
import { getURLKeywords, search, setSearch } from './shared';
import { importModule } from '../module/import_module';
import { TOP_URI } from '../module/env/uri';

let offloadModule: (() => void) | null = null;

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    if (navigator !== undefined && isbot(navigator.userAgent)) {
        return;
    }

    addNavBar(NavBarPage.HOME, () => {
        if (w.scrollY !== 0) {
            scrollToTop();
            return;
        }
        const keywords = getURLKeywords();
        if (search === null || keywords === '') {
            redirect(TOP_URI);
            return;
        }
        changeURL(TOP_URI);
        search(true);
    });

    const asyncModulePromise = import(
        /* webpackExports: ["default", "offload"] */
        './async'
    );

    const keywords = getURLKeywords();
    const keywordsQuery = keywords === '' ? '' : 'keywords=' + keywords + '&';
    sendServerRequest('get_series?' + keywordsQuery + 'pivot=0', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            const currentPgid = pgid;
            const asyncModule = await importModule(asyncModulePromise);
            if (pgid !== currentPgid) {
                return;
            }
            offloadModule = asyncModule.offload;
            asyncModule.default(parseResponse(response, parseSeriesInfo), keywords);
            showPage();
        },
        [ServerRequestOptionProp.LOGOUT_PARAM]: keywordsQuery.slice(0, -1),
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

export function offload() {
    setSearch(null);
    if (offloadModule !== null) {
        offloadModule();
        offloadModule = null;
    }
}
