import { scrollToTop } from '../module/dom/scroll/to_top';
import { addNavBar } from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { parseResponse } from '../module/server/parse_response';
import { changeURL } from '../module/dom/location/change';
import { w } from '../module/dom/window';
import { isbot } from 'isbot';
import { type ShowPageFunc } from '../module/global/type';
import { redirect } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import { parseSeriesInfo } from '../module/type/SeriesInfo';
import { getURLKeywords, search } from './shared';
import { importModule } from '../module/import_module';
import { TOP_URI } from '../module/env/uri';
import { joinHttpForms } from '../module/string/http_form/join';
import { buildHttpForm } from '../module/string/http_form/build';

export default function (showPage: ShowPageFunc) {
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
    const keywordsQuery = buildHttpForm({ keywords: keywords });
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
        [ServerRequestOptionKey.CONTENT]: joinHttpForms(
            keywordsQuery,
            buildHttpForm({ pivot: 0 }),
        ),
        [ServerRequestOptionKey.LOGOUT_PARAM]: keywordsQuery,
        [ServerRequestOptionKey.METHOD]: 'GET',
    });
}
