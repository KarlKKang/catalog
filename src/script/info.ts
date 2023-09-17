// JavaScript Document
import {
    authenticate,
    addNavBar,
    scrollToHash,
} from './module/main';
import {
    clearSessionStorage,
    getBody,
    showElement,
} from './module/dom';

export default function () {
    clearSessionStorage();

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