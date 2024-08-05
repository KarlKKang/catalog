import { getSearchParam } from './module/dom/document';
import { clearSessionStorage } from './module/dom/session_storage';
import { createDivElement } from './module/dom/create_element';
import { addClass, appendChild } from './module/dom/element';
import { body } from './module/dom/body';
import type { ShowPageFunc } from './module/global';
import { addNavBar } from './module/nav_bar';
import { NavBarPage } from './module/nav_bar/enum';
import { scrollToHash } from './module/common';
import html from '../html/info.html';
import * as styles from '../css/news.module.scss';
import { createNewsTemplate, parseNewsStyle } from './module/news';
import { infoPageTitle } from './module/text/page_title';
import { addManualMultiLanguageClass } from './module/dom/create_element/multi_language';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    if (getSearchParam('nav-bar') !== 'no') {
        addNavBar(NavBarPage.INFO);
    }
    showPage();
    const [outerContainer, innerContainer] = createNewsTemplate(infoPageTitle, null, 1699333200);
    const contentContainer = createDivElement();
    addClass(contentContainer, styles.content);
    addManualMultiLanguageClass(contentContainer);
    contentContainer.innerHTML = html;
    parseNewsStyle(contentContainer);
    appendChild(innerContainer, contentContainer);
    appendChild(body, outerContainer);
    scrollToHash();
}
