// JavaScript Document
import {
    authenticate,
    addNavBar,
    scrollToHash,
    showPage,
} from './module/main';
import {
    clearSessionStorage,
} from './module/dom';
import type { HTMLImport } from './module/type/HTMLImport';

export default function (styleImportPromises: Promise<any>[], htmlImportPromises: HTMLImport) {
    clearSessionStorage();

    authenticate({
        successful:
            function () {
                showPage(styleImportPromises, htmlImportPromises, () => {
                    addNavBar('info');
                    scrollToHash();
                });
            },
        failed:
            function () {
                showPage(styleImportPromises, htmlImportPromises, () => {
                    scrollToHash();
                });
            },
    });
}