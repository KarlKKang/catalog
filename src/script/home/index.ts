import { scrollToTop } from '../module/dom/scroll/to_top';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { parseResponse } from '../module/server/parse_response';
import { changeURL } from '../module/dom/document';
import { w } from '../module/dom/window';
import { clearSessionStorage } from '../module/session_storage/clear';
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
        [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
            const currentPgid = pgid;
            const asyncModule = await asyncModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default(parseResponse(response, parseSeriesInfo), keywords);
            showPage();
        },
        [ServerRequestOptionKey.CONTENT]: joinURLForms(
            keywordsQuery,
            buildURLForm({ pivot: 0 }),
        ),
        [ServerRequestOptionKey.LOGOUT_PARAM]: keywordsQuery,
        [ServerRequestOptionKey.METHOD]: 'GET',
    });
}
