// JavaScript Document
import 'core-js';
import {
    DEVELOPMENT, TOP_URL,
} from './module/env/constant';
import {
    authenticate,
    clearCookies,
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
    showElement,
    getBaseURL,
} from './module/DOM';

addEventListener(w, 'load', function () {
    if (getBaseURL() !== TOP_URL + '/info' && !DEVELOPMENT) {
        redirect(TOP_URL + '/info', true);
        return;
    }

    clearCookies();

    authenticate({
        successful:
            function () {
                removeClass(d.documentElement, 'no-header-padding');
                showElement(getById('header'));
                showElement(getById('nav-btn'));
                showElement(getBody());
                navListeners();
                scrollToHash(true);
            },
        failed:
            function () {
                showElement(getBody());
                scrollToHash(false);
            },
    });

});