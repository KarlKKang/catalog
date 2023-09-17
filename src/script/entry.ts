import 'core-js';
import { getBaseURL, getTitle, redirect, w, addEventListenerOnce } from './module/dom';
import { LOGIN_URL, TOP_DOMAIN, TOP_URL } from './module/env/constant';
import { show as showMessage } from './module/message';
import { moduleImportError } from './module/message/template/param';
import { objectKeyExists } from './module/main';

(function () {
    const pages = {
        '': () => import('./index'),
        'confirm_new_email': () => import('./confirm_new_email'),
        'console': () => import('./console'),
        'image': () => import('./image'),
        'info': () => import('./info'),
        'message': () => import('./message'),
        'my_account': () => import('./my_account'),
        'new_email': () => import('./new_email'),
        'register': () => import('./register'),
        'special_register': () => import('./special_register'),
    };
    const directories = {
        'bangumi': () => import('./bangumi'),
        'news': () => import('./news'),
    };
    const loginPages = {
        '': () => import('./login'),
        'message': () => import('./message'),
        'request_password_reset': () => import('./request_password_reset'),
        'password_reset': () => import('./password_reset'),
    };

    let baseURL = getBaseURL();

    if (baseURL === TOP_URL || baseURL === LOGIN_URL) {
        baseURL += '/';
    }

    if (baseURL.startsWith(TOP_URL + '/')) {
        let page = baseURL.substring(TOP_URL.length + 1);
        if (objectKeyExists(page, pages)) {
            loadPage(pages[page as keyof typeof pages]());
            return;
        }
        page = page.substring(0, page.indexOf('/'));
        if (objectKeyExists(page, directories)) {
            loadPage(directories[page as keyof typeof directories]());
            return;
        }
    }

    if (baseURL.startsWith(LOGIN_URL + '/')) {
        const page = baseURL.substring(LOGIN_URL.length + 1);
        if (objectKeyExists(page, loginPages)) {
            loadPage(loginPages[page as keyof typeof loginPages]());
            return;
        }
    }

    if (getTitle().startsWith('404 | ' + TOP_DOMAIN)) {
        loadPage(import('./404'));
    } else {
        redirect(TOP_URL + '/404');
    }
})();

async function loadPage(importPromise: Promise<any>) {
    let pageScript: any;
    try {
        pageScript = await importPromise;
    } catch (e) {
        showMessage(moduleImportError(e));
        throw e;
    }
    addEventListenerOnce(w, 'load', pageScript.default);
}