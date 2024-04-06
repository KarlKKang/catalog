import {
    addClass,
    appendChild,
    body,
    clearSessionStorage, createDivElement,
} from './module/dom';
import type { ShowPageFunc } from './module/global';
import { addNavBar } from './module/nav_bar';
import { NavBarPage } from './module/nav_bar/enum';
import { getURLParam, scrollToHash } from './module/common';
import html from '../html/info.html';
import * as styles from '../css/news.module.scss';
import { createNewsTemplate, parseNewsStyle } from './module/news';
import { infoPageTitle } from './module/text/page_title';
import { addManualAllLanguageClass } from './module/dom/create_element/all_language';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    if (getURLParam('nav-bar') !== 'no') {
        addNavBar(NavBarPage.INFO);
    }
    showPage();
    const [outerContainer, innerContainer] = createNewsTemplate(infoPageTitle, null, 1699333200);
    const contentContainer = createDivElement();
    addClass(contentContainer, styles.content);
    addManualAllLanguageClass(contentContainer);
    contentContainer.innerHTML = html;
    parseNewsStyle(contentContainer);
    appendChild(innerContainer, contentContainer);
    appendChild(body, outerContainer);
    scrollToHash();
}