// JavaScript Document
import {
    authenticate,
    addNavBar,
    scrollToHash,
    NAV_BAR_INFO,
} from './module/common';
import {
    clearSessionStorage,
} from './module/dom';
import type { RedirectFunc } from './module/type/RedirectFunc';
import type { ShowPageFunc } from './module/type/ShowPageFunc';

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();

    authenticate(redirect, {
        successful:
            function () {
                showPage(() => {
                    addNavBar(redirect, NAV_BAR_INFO);
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