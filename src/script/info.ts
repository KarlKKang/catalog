import {
    authenticate,
    addNavBar,
    scrollToHash,
    NAV_BAR_INFO,
} from './module/common';
import {
    clearSessionStorage,
} from './module/dom';
import type { ShowPageFunc } from './module/type/ShowPageFunc';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    authenticate({
        successful:
            function () {
                showPage(() => {
                    addNavBar(NAV_BAR_INFO);
                    scrollToHash();
                });
            },
        failed:
            function () {
                showPage(() => {
                    scrollToHash();
                });
            },
    });
}