// JavaScript Document
import 'core-js';
import {
    TOP_URL,
} from './module/env/constant';
import {
    authenticate,
    clearCookies,
    addNavBar,
    scrollToHash,
} from './module/main';
import {
    w,
    addEventListener,
    redirect,
    getBody,
    showElement,
    getBaseURL,
} from './module/dom';

addEventListener(w, 'load', function () {
    if (getBaseURL() !== TOP_URL + '/info') {
        redirect(TOP_URL + '/info', true);
        return;
    }

    clearCookies();

    authenticate({
        successful:
            function () {
                showElement(getBody());
                addNavBar('info');
                scrollToHash();
            },
        failed:
            function () {
                showElement(getBody());
                scrollToHash();
            },
    });

});