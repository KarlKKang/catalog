// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
} from './module/env/constant';
import {
    authenticate,
    clearCookies,
    cssVarWrapper,
    navListeners,
    scrollToHash,
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    removeClass,
    getBody,
    getById,
    d,
} from './module/DOM';

addEventListener(w, 'load', function () {
    cssVarWrapper();
    clearCookies();

    if (!getHref().startsWith('https://featherine.com/info') && !DEVELOPMENT) {
        redirect('https://featherine.com/info', true);
        return;
    }

    authenticate({
        successful:
            function () {
                removeClass(d.documentElement, 'no-header-padding');
                removeClass(getById('header'), 'hidden');
                removeClass(getById('nav-btn'), 'hidden');
                removeClass(getBody(), "hidden");
                navListeners();
                scrollToHash(true);
            },
        failed:
            function () {
                removeClass(getBody(), "hidden");
                scrollToHash(false);
            },
    });

});