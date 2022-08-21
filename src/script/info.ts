// JavaScript Document
import "core-js";
import {
    DEVELOPMENT, TOP_URL,
} from './module/env/constant';
import {
    authenticate,
    checkBaseURL,
    clearCookies,
    cssVarWrapper,
    navListeners,
    scrollToHash,
} from './module/main';
import {
    w,
    addEventListener,
    redirect,
    removeClass,
    getBody,
    getById,
    d,
} from './module/DOM';

addEventListener(w, 'load', function () {
    if (!checkBaseURL(TOP_URL + '/info') && !DEVELOPMENT) {
        redirect(TOP_URL + '/info', true);
        return;
    }

    cssVarWrapper();
    clearCookies();

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