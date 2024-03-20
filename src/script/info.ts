import {
    addNavBar,
    scrollToHash,
    NAV_BAR_INFO,
} from './module/common';
import { authenticate } from './module/server';
import {
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
import '../css/nav_bar.scss';
import '../css/news.scss';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    authenticate({
        successful:
            function () {
                showPage();
                body.innerHTML = html;
                addNavBar(NAV_BAR_INFO);
                scrollToHash();
            },
        failed:
            function () {
                showPage();
                body.innerHTML = html;
                scrollToHash();
            },
    });
}