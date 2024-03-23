import {
    scrollToHash,
} from './module/common';
import { addNavBar } from './module/nav_bar';
import { NavBarPage } from './module/nav_bar/enum';
import { authenticate } from './module/server';
import {
    addClass,
    appendChild,
    body,
    clearSessionStorage,
    createDivElement,
} from './module/dom';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import html from '../html/info.html';
import * as styles from '../css/news.module.scss';
import { addManualAllLanguageClass } from './module/dom/create_element/all_language';
import { createNewsTemplate, parseNewsStyle } from './module/news';
import { infoPageTitle } from './module/text/page_title';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const showPageCallback = (navBar: boolean) => {
        showPage();

        const [outerContainer, innerContainer] = createNewsTemplate(infoPageTitle, null, 1699333200);
        const contentContainer = createDivElement();
        addClass(contentContainer, styles.content);
        addManualAllLanguageClass(contentContainer);
        contentContainer.innerHTML = html;
        parseNewsStyle(contentContainer);
        appendChild(innerContainer, contentContainer);
        appendChild(body, outerContainer);

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