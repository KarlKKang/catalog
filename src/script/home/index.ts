import { scrollToTop } from '../module/dom/scroll';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import { changeURL, w } from '../module/dom/document';
import { clearSessionStorage } from '../module/dom/session_storage';
import { isbot } from 'isbot';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { parseSeriesInfo } from '../module/type/SeriesInfo';
import { getURLKeywords, search } from './shared';
import { importModule } from '../module/import_module';
import { TOP_URI } from '../module/env/uri';
import { buildURLForm, joinURLForms } from '../module/http_form';

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

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );

    const keywords = getURLKeywords();
    const keywordsQuery = buildURLForm({ keywords: keywords });
    sendServerRequest('get_series', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            const currentPgid = pgid;
            const asyncModule = await asyncModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default(parseResponse(response, parseSeriesInfo), keywords);
            showPage();
        },
        [ServerRequestOptionProp.CONTENT]: joinURLForms(
            keywordsQuery,
            buildURLForm({ pivot: 0 }),
        ),
        [ServerRequestOptionProp.LOGOUT_PARAM]: keywordsQuery,
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}
