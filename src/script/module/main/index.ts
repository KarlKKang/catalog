import {
    SERVER_URL,
    DEVELOPMENT,
    TOP_URL,
    LOGIN_URL
} from '../env/constant';

import { show as showMessage } from '../message';
import { moduleImportError, insufficientPermissions } from '../message/template/param';
import { sessionEnded, connectionError, status403, status429, status503, status400And500, invalidResponse } from '../message/template/param/server';

import {
    w,
    getBaseURL,
    redirect,
    deleteCookie,
    getHash,
    getByIdNative,
    addClass,
    removeClass,
    getParentElement,
    addEventListener,
    appendChild,
    removeEventListener,
    createParagraphElement,
    createDivElement,
    prependChild,
    getBody,
    appendText,
} from '../dom';

import * as MaintenanceInfo from '../type/MaintenanceInfo';
import type { CDNCredentials } from '../type/CDNCredentials';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+[\]{}\\|;:'",<.>/?]{8,64}$/;
export const EMAIL_REGEX = /^(?=.{3,254}$)[^\s@]+@[^\s@]+$/;

//////////////////////////////////////// Helper functions ////////////////////////////////////////

export function getURLParam(name: string): string | null {
    const urlObj = new URL(w.location.href);
    return urlObj.searchParams.get(name);
}

interface SendServerRequestOption {
    callback?: (response: string) => void | Promise<void>;
    content?: string;
    withCredentials?: boolean;
    method?: 'POST' | 'GET';
    logoutParam?: string;
    connectionErrorRetry?: number;
    connectionErrorRetryTimeout?: number;
}

function xhrOnErrorCallback(uri: string, options: SendServerRequestOption) {
    if (options.connectionErrorRetry === undefined) {
        options.connectionErrorRetry = 2;
    } else {
        options.connectionErrorRetry -= 1;
    }

    if (options.connectionErrorRetryTimeout === undefined) {
        options.connectionErrorRetryTimeout = 500;
    } else {
        options.connectionErrorRetryTimeout *= 2;
    }

    if (options.connectionErrorRetry < 0) {
        showMessage(connectionError);
    } else {
        setTimeout(function () {
            sendServerRequest(uri, options);
        }, options.connectionErrorRetryTimeout);
    }
}

function checkXHRStatus(response: XMLHttpRequest, uri: string, options: SendServerRequestOption): boolean {
    const status = response.status;
    const responseText = response.responseText;
    if (status === 200) {
        return true;
    } else if (status === 403) {
        if (responseText === 'SESSION ENDED') {
            showMessage(sessionEnded);
        } else if (responseText === 'INSUFFICIENT PERMISSIONS') {
            showMessage(insufficientPermissions);
        } else if (responseText === 'UNAUTHORIZED') {
            const logoutParam = options.logoutParam;
            redirect(LOGIN_URL + ((logoutParam === undefined || logoutParam === '') ? '' : ('?' + logoutParam)), true);
        } else {
            showMessage(status403);
        }
    } else if (status === 429) {
        showMessage(status429);
    } else if (status === 503) {
        let parsedResponse: MaintenanceInfo.MaintenanceInfo;
        try {
            parsedResponse = JSON.parse(responseText);
            MaintenanceInfo.check(parsedResponse);
        } catch (e) {
            showMessage(invalidResponse);
            return false;
        }
        showMessage(status503(parsedResponse));
    } else if (status === 500 || status === 400) {
        if (responseText.startsWith('500 Internal Server Error') || responseText.startsWith('400 Bad Request')) {
            showMessage(status400And500(responseText));
        } else {
            showMessage();
        }
    } else if (status === 404 && response.responseText === 'REJECTED') {
        redirect(TOP_URL);
    } else {
        xhrOnErrorCallback(uri, options);
    }
    return false;
}

export function sendServerRequest(uri: string, options: SendServerRequestOption): XMLHttpRequest {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open(options.method ?? 'POST', SERVER_URL + '/' + uri, true);
    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlhttp.withCredentials = options.withCredentials ?? true;

    function onError() {
        removeListeners();
        xhrOnErrorCallback(uri, options);
    }

    function onAbort() {
        removeListeners();
    }

    function onLoad() {
        removeListeners();
        if (checkXHRStatus(xmlhttp, uri, options)) {
            options.callback && options.callback(xmlhttp.responseText);
        }
    }

    function removeListeners() {
        removeEventListener(xmlhttp, 'error', onError);
        removeEventListener(xmlhttp, 'abort', onAbort);
        removeEventListener(xmlhttp, 'load', onLoad);
    }

    addEventListener(xmlhttp, 'error', onError);
    addEventListener(xmlhttp, 'abort', onAbort);
    addEventListener(xmlhttp, 'load', onLoad);

    xmlhttp.send(options.content ?? '');
    return xmlhttp;
}

export function authenticate(callback: { successful?: () => void; failed?: () => void }) {
    sendServerRequest('get_authentication_state', {
        callback: function (response: string) {
            if (response === 'APPROVED') {
                callback.successful && callback.successful();
            } else if (response === 'FAILED') {
                callback.failed && callback.failed();
            } else {
                showMessage();
            }
        }
    });
}

export function logout(callback: () => void,) {
    sendServerRequest('logout', {
        callback: function (response: string) {
            if (response === 'PARTIAL' || response === 'DONE') {
                if (DEVELOPMENT) {
                    console.log(response);
                }
                callback();
            } else {
                showMessage();
            }
        }
    });
}

export function passwordStyling(element: HTMLInputElement) {
    function inputChangeHandler() {
        if (element.value === '') {
            removeClass(element, 'password-font');
        } else {
            addClass(element, 'password-font');
        }
    }

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); //The object returned is mutable but mutating it has no effect on the original property's configuration.
    if (descriptor !== undefined && descriptor.configurable) { // 'undefined' in Chrome prior to Chrome 43 (https://developer.chrome.com/blog/DOM-attributes-now-on-the-prototype-chain/), not configurable in Safari 9.
        const originalSet = descriptor.set;
        if (originalSet !== undefined) {
            // define our own setter
            descriptor.set = function (...args) {
                originalSet.apply(this, args);
                inputChangeHandler();
            };
            Object.defineProperty(element, 'value', descriptor);
        }
    }

    addEventListener(element, 'input', inputChangeHandler);
    addEventListener(element, 'change', inputChangeHandler);
}

export function addNavBar(page?: 'home' | 'news' | 'my_account' | 'info', currentPageCallback?: () => void) {
    const getNavButton = function (name: string): [HTMLDivElement, HTMLDivElement] {
        const container = createDivElement();
        const containerInner = createDivElement();
        const iconContainer = createDivElement();
        addClass(iconContainer, 'icon');
        const nameContainer = createParagraphElement();
        appendText(nameContainer, name);
        appendChild(containerInner, iconContainer);
        appendChild(containerInner, nameContainer);
        appendChild(container, containerInner);
        return [container, iconContainer];
    };

    const navButton1 = getNavButton('ホーム');
    const navButton2 = getNavButton('お知らせ');
    const navButton3 = getNavButton('マイページ');
    const navButton4 = getNavButton('ご利用ガイド');

    const navBar = createDivElement();
    navBar.id = 'nav-bar';
    prependChild(getBody(), navBar);
    appendChild(navBar, navButton1[0]);
    appendChild(navBar, navButton2[0]);
    appendChild(navBar, navButton3[0]);
    appendChild(navBar, navButton4[0]);

    const callback = currentPageCallback || scrollToTop;

    addEventListener(navButton1[0], 'click', function () {
        if (page === 'home') {
            callback();
            return;
        }
        redirect(TOP_URL);
    });

    addEventListener(navButton2[0], 'click', function () {
        if (page === 'news') {
            callback();
            return;
        }
        redirect(TOP_URL + '/news/');
    });

    addEventListener(navButton3[0], 'click', function () {
        if (page === 'my_account') {
            callback();
            return;
        }
        redirect(TOP_URL + '/my_account');
    });

    addEventListener(navButton4[0], 'click', function () {
        if (page === 'info') {
            callback();
            return;
        }
        redirect(TOP_URL + '/info');
    });

    const navBarPadding = createDivElement();
    navBarPadding.id = 'nav-bar-padding';
    appendChild(getBody(), navBarPadding);

    const addNavBarIcon = async function () {
        let icons: typeof import(
            './icons'
        );
        try {
            icons = await import(
                './icons'
            );
        } catch (e) {
            showMessage(moduleImportError(e));
            throw e;
        }
        appendChild(navButton1[1], page === 'home' ? icons.getHomeFillIcon() : icons.getHomeIcon());
        appendChild(navButton2[1], page === 'news' ? icons.getNewsFillIcon() : icons.getNewsIcon());
        appendChild(navButton3[1], page === 'my_account' ? icons.getMyAccountFillIcon() : icons.getMyAccountIcon());
        appendChild(navButton4[1], page === 'info' ? icons.getInfoFillIcon() : icons.getInfoIcon());
    };
    addNavBarIcon();
}

export function scrollToTop() {
    w.scrollBy(0, -1 * w.scrollY);
}

export function secToTimestamp(sec: number, templateSec?: number) {
    if (isNaN(sec)) {
        return '0:00';
    }

    if (templateSec === undefined || isNaN(templateSec) || templateSec < sec) {
        templateSec = sec;
    }

    const secParsed = parseSec(sec);
    const templateSecParsed = templateSec === sec ? secParsed : parseSec(templateSec);

    let result = '';
    let minText = secParsed.min.toString();

    if (templateSecParsed.hour > 0) {
        const hourText = secParsed.hour.toString();
        result += '0'.repeat(templateSecParsed.hour.toString().length - hourText.length) + hourText + ':';
        if (secParsed.min < 10) {
            minText = '0' + minText;
        }
    } else {
        minText = '0'.repeat(templateSecParsed.min.toString().length - minText.length) + minText;
    }

    let secText = secParsed.sec.toString();
    if (secParsed.sec < 10) {
        secText = '0' + secText;
    }

    return result + minText + ':' + secText;
}

function parseSec(sec: number) {
    const hour = Math.floor(sec / 60 / 60);
    sec = sec - hour * 60 * 60;
    const min = Math.floor(sec / 60);
    sec = sec - min * 60;
    sec = Math.floor(sec);
    return {
        hour: hour,
        min: min,
        sec: Math.floor(sec)
    };
}

export function changeColor(elem: HTMLElement, color: string | null) {
    removeClass(elem, 'color-red');
    removeClass(elem, 'color-green');
    removeClass(elem, 'color-orange');
    color && addClass(elem, 'color-' + color);
}

export function concatenateSignedURL(url: string, credentials: CDNCredentials, resourceURLOverride?: string) {
    const policy = credentials['Policy'];
    policy['Statement'][0]['Resource'] = resourceURLOverride ?? url;
    let policyString = JSON.stringify(policy);
    policyString = w.btoa(policyString);
    policyString = policyString.replace(/\+/g, '-');
    policyString = policyString.replace(/=/g, '_');
    policyString = policyString.replace(/\//g, '~');
    return url + '?Policy=' + policyString + '&Signature=' + credentials['Signature'] + '&Key-Pair-Id=' + credentials['Key-Pair-Id'];
}

export function encodeCFURIComponent(uri: string) {
    return encodeURIComponent(uri).replace(/%20/g, '+');
}

export function disableInput(inputElement: HTMLInputElement, disabled: boolean) {
    inputElement.disabled = disabled;
    if (disabled) {
        addClass(getParentElement(inputElement), 'disabled');
    } else {
        removeClass(getParentElement(inputElement), 'disabled');
    }
}

export function clearCookies() {
    if (getBaseURL() != TOP_URL + '/message') {
        deleteCookie('local-message-param');
    }
    if (getBaseURL() != TOP_URL + '/image') {
        deleteCookie('local-image-param');
    }
}

export function removeRightClick(elem: Element) {
    addEventListener(elem, 'contextmenu', event => event.preventDefault());
}

export function scrollToHash() {
    // Use this function only when the hash element is loaded after the DOM loads.
    const scrollID = getHash();
    if (scrollID !== '') {
        const elem = getByIdNative(scrollID);
        if (elem !== null) {
            setTimeout(function () {
                w.scrollBy(0, elem.getBoundingClientRect().top);
            }, 500); //Give UI some time to load.
        }
    }
}

export function getLocalTime(unixTimestamp?: number) {
    let date: Date;
    if (unixTimestamp === undefined) {
        date = new Date();
    } else {
        date = new Date(unixTimestamp * 1000);
    }
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        dayOfWeek: getDayOfWeek(date),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds()
    };
}

function getDayOfWeek(date: Date): string {
    const index = date.getDay();
    let result: string;
    switch (index) {
        case 1:
            result = '月';
            break;
        case 2:
            result = '火';
            break;
        case 3:
            result = '水';
            break;
        case 4:
            result = '木';
            break;
        case 5:
            result = '金';
            break;
        case 6:
            result = '土';
            break;
        default:
            result = '日';
    }
    return result;
}

export function objectKeyExists(key: PropertyKey, obj: object) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

export function isString(str: any) {
    return typeof str === 'string' || str instanceof String;
}

export function handleAuthenticationResult(
    response: string,
    failedCallback: () => void,
    failedTotpCallback: () => void,
    deactivatedCallback: () => void,
    tooManyRequestsCallback: () => void,
): boolean {
    if (response == 'FAILED') {
        failedCallback();
        return false;
    } else if (response == 'DEACTIVATED') {
        deactivatedCallback();
        return false;
    } else if (response == 'TOO MANY REQUESTS') {
        tooManyRequestsCallback();
        return false;
    } else if (response == 'FAILED TOTP') {
        failedTotpCallback();
        return false;
    }
    return true;
}