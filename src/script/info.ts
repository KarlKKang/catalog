import {
    scrollToHash,
} from './module/common';
import { addNavBar } from './module/nav_bar';
import { NavBarPage } from './module/nav_bar/enum';
import { authenticate } from './module/server';
import {
    body,
    clearSessionStorage,
} from './module/dom';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import html from '../html/info.html';

import '../css/news.scss';
import { addManualAllLanguageClass } from './module/dom/create_element/all_language';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const showPageCallback = (navBar: boolean) => {
        showPage();
        body.innerHTML = html;
        addManualAllLanguageClass(body);
        navBar && addNavBar(NavBarPage.INFO);
        scrollToHash();
    };

    authenticate({
        successful:
            function () {
                showPageCallback(true);
            },
        failed:
            function () {
                showPageCallback(false);
            },
    });
}