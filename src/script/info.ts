import {
    scrollToHash,
} from './module/common';
import { addNavBar } from './module/nav_bar';
import { NAV_BAR_INFO } from './module/nav_bar/enum';
import { authenticate } from './module/server';
import {
    addClass,
    body,
    clearSessionStorage,
} from './module/dom';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import html from '../html/info.html';

import '../font/dist/NotoSans/NotoSans-Light.css';
import '../font/dist/NotoSans/NotoSans-Regular.css';
import '../font/dist/NotoSans/NotoSans-Medium.css';
import '../font/dist/NotoSansJP/NotoSansJP-Regular.css';
import '../font/dist/NotoSansTC/NotoSansTC-Light.css';
import '../font/dist/NotoSansTC/NotoSansTC-Regular.css';
import '../font/dist/NotoSansTC/NotoSansTC-Medium.css';
import '../font/dist/NotoSansSC/NotoSansSC-Light.css';
import '../font/dist/NotoSansSC/NotoSansSC-Regular.css';
import '../font/dist/NotoSansSC/NotoSansSC-Medium.css';
import { container as allLanguageContainerClass } from '../css/all_languages.module.scss';
import '../css/news.scss';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const showPageCallback = (navBar: boolean) => {
        showPage();
        body.innerHTML = html;
        addClass(body, allLanguageContainerClass);
        navBar && addNavBar(NAV_BAR_INFO);
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