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

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    authenticate({
        successful:
            function () {
                showPage(() => {
                    body.innerHTML = html;
                    addNavBar(NAV_BAR_INFO);
                    scrollToHash();
                });
            },
        failed:
            function () {
                showPage(() => {
                    body.innerHTML = html;
                    scrollToHash();
                });
            },
    });
}