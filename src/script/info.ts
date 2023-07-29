// JavaScript Document
import {
    authenticate,
    clearCookies,
    addNavBar,
    scrollToHash,
} from './module/main';
import {
    getBody,
    showElement,
} from './module/dom';

export default function () {
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
}