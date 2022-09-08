import {
    SERVER_URL,
    DEVELOPMENT,
    TOP_URL,
    LOGIN_URL
} from '../env/constant';

import { show as showMessage } from '../message';
import { cssVarError, moduleImportError } from '../message/template/param';
import { connectionError, status403, status429, status503, status400And500 } from '../message/template/param/server';

import {
    w,
    getHref,
    redirect,
    deleteCookie,
    getHash,

    getById,
    getByIdNative,
    addClass,
    removeClass,
    toggleClass,
    containsClass,
    getParent,
    addEventListener,
    createElement,
    appendChild,
} from '../DOM';

import type { CDNCredentials } from '../type';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+[\]{}\\|;:'",<.>/?]{8,64}$/;
export const EMAIL_REGEX = /^(?=.{3,254}$)[^\s@]+@[^\s@]+$/;

//////////////////////////////////////// Helper functions ////////////////////////////////////////

////////////////////////////////////////
export function getURLParam(name: string): string | null {
    const urlObj = new URL(getHref());
    return urlObj.searchParams.get(name);
}
////////////////////////////////////////

////////////////////////////////////////
function addXHROnError(xmlhttp: XMLHttpRequest) {
    xmlhttp.onerror = function () {
        showMessage(connectionError);
    };
}
////////////////////////////////////////

////////////////////////////////////////
function checkXHRStatus(response: XMLHttpRequest, logoutParam?: string): boolean {
    const status = response.status;
    if (response.readyState == 4) {
        if (status == 200) {
            return true;
        } else if (status == 403) {
            if (response.responseText == 'SESSION ENDED') {
                redirect(TOP_URL);
            } else if (response.responseText == 'INSUFFICIENT PERMISSIONS') {
                redirect(TOP_URL, true);
            } else if (response.responseText == 'UNAUTHORIZED') {
                redirect(LOGIN_URL + ((logoutParam === undefined || logoutParam === '') ? '' : ('?' + logoutParam)), true);
            } else if (response.responseText != 'CRAWLER') {
                showMessage(status403);
            }
        } else if (status == 429) {
            showMessage(status429);
        } else if (status == 503) {
            showMessage(status503);
        } else if (status == 500 || status == 400) {
            const responseText = response.responseText;
            if (responseText.startsWith('500 Internal Server Error') || responseText.startsWith('400 Bad Request')) {
                showMessage(status400And500(responseText));
            }
            else {
                showMessage();
            }
        } else if (status == 404 && response.responseText == 'REJECTED') {
            redirect(TOP_URL);
        } else {
            showMessage(connectionError);
        }
        return false;
    } else {
        return false;
    }
}
////////////////////////////////////////

////////////////////////////////////////
interface SendServerRequestOption {
    callback?: (response: string) => void,
    content?: string,
    withCredentials?: boolean,
    method?: 'POST' | 'GET',
    logoutParam?: string
}
export function sendServerRequest(uri: string, options: SendServerRequestOption) {
    if (options.content === undefined) {
        options.content = '';
    }
    if (options.withCredentials === undefined) {
        options.withCredentials = true;
    }
    if (options.method === undefined) {
        options.method = 'POST';
    }

    const xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (checkXHRStatus(this, options.logoutParam)) {
            if (options.callback === undefined) {
                return;
            }
            options.callback(this.responseText);
        }
    };
    addXHROnError(xmlhttp);
    xmlhttp.open(options.method, SERVER_URL + "/" + uri, true);
    xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlhttp.withCredentials = options.withCredentials;
    xmlhttp.send(options.content);
}
////////////////////////////////////////

////////////////////////////////////////
export function authenticate(callback: { successful?: () => void, failed?: () => void }) {
    let successful = function () { return; };
    let failed = function () { return; };
    if (callback.successful !== undefined) {
        successful = callback.successful;
    }
    if (callback.failed !== undefined) {
        failed = callback.failed;
    }

    sendServerRequest('get_authentication_state.php', {
        callback: function (response: string) {
            if (response == "APPROVED") {
                successful();
            } else if (response == "FAILED") {
                failed();
            } else {
                showMessage();
            }
        }
    });
}
////////////////////////////////////////

////////////////////////////////////////
export function logout(callback: () => void,) {
    if (callback === undefined) {
        callback = function () { return; };
    }

    sendServerRequest('logout.php', {
        callback: function (response: string) {
            if (response == 'PARTIAL' || response == 'DONE') {
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
////////////////////////////////////////

////////////////////////////////////////
export function passwordStyling(element: HTMLInputElement) {
    function inputChangeHandler() {
        if (element.value === '') {
            removeClass(element, 'password-font');
        } else {
            addClass(element, 'password-font');
        }
    }

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value"); //The object returned is mutable but mutating it has no effect on the original property's configuration.
    if (descriptor !== undefined && descriptor.configurable) { // 'undefined' in Chrome prior to Chrome 43 (https://developer.chrome.com/blog/DOM-attributes-now-on-the-prototype-chain/), not configurable in Safari 9.
        const originalSet = descriptor.set;
        if (originalSet !== undefined) {
            // define our own setter
            descriptor.set = function (...args) {
                originalSet.apply(this, args);
                inputChangeHandler();
            }
            Object.defineProperty(element, "value", descriptor);
        }
    }

    addEventListener(element, 'input', inputChangeHandler);
    addEventListener(element, 'change', inputChangeHandler);
}
////////////////////////////////////////

////////////////////////////////////////
function navUpdate() {
    const navBtn = getById('nav-btn');
    toggleClass(navBtn, 'active');
    const menu = getById('nav-menu');

    if (containsClass(navBtn, 'active')) {
        removeClass(menu, 'invisible');
        removeClass(menu, 'transparent');
    } else {
        addClass(menu, 'transparent');
        setTimeout(function () {
            addClass(menu, 'invisible');
        }, 300);
    }
}
////////////////////////////////////////

////////////////////////////////////////
export function navListeners() {
    function getNavMenuButton(innerHTML: string) {
        const navMenuButtonContainer = createElement('p');
        const navMenuButton = createElement('span');
        navMenuButton.innerHTML = innerHTML;
        appendChild(navMenuButtonContainer, navMenuButton);
        return {
            container: navMenuButtonContainer,
            button: navMenuButton
        };
    }

    const navMenuButton1 = getNavMenuButton('ライブラリ／LIBRARY');
    const navMenuButton2 = getNavMenuButton('お知らせ／NEWS');
    const navMenuButton3 = getNavMenuButton('マイページ／ACCOUNT SETTINGS');
    const navMenuButton4 = getNavMenuButton('ご利用ガイド／POLICY＆GUIDE');
    const navMenuButton5 = getNavMenuButton('ログアウト／LOG OUT');

    const navMenuContentContainer = getById('nav-menu-content');
    appendChild(navMenuContentContainer, navMenuButton1.container);
    appendChild(navMenuContentContainer, navMenuButton2.container);
    appendChild(navMenuContentContainer, navMenuButton3.container);
    appendChild(navMenuContentContainer, navMenuButton4.container);
    appendChild(navMenuContentContainer, navMenuButton5.container);

    addEventListener(getById('nav-btn'), 'click', function () {
        navUpdate();
    });

    addEventListener(navMenuButton1.button, 'click', function () {
        redirect(TOP_URL);
    });

    addEventListener(navMenuButton2.button, 'click', function () {
        redirect(DEVELOPMENT ? 'news.html' : (TOP_URL + '/news/'));
    });

    addEventListener(navMenuButton3.button, 'click', function () {
        redirect(DEVELOPMENT ? 'my_account.html' : (TOP_URL + '/my_account'));
    });

    addEventListener(navMenuButton4.button, 'click', function () {
        redirect(DEVELOPMENT ? 'info.html' : (TOP_URL + '/info'));
    });

    addEventListener(navMenuButton5.button, 'click', function () {
        logout(function () { redirect(LOGIN_URL); });
    });
}
////////////////////////////////////////

////////////////////////////////////////
export function secToTimestamp(sec: number) {
    if (isNaN(sec)) {
        return '--:--';
    }
    const hour = Math.floor(sec / 60 / 60);
    sec = sec - hour * 60 * 60;
    const min = Math.floor(sec / 60);
    sec = sec - min * 60;

    sec = Math.floor(sec);
    let secText = sec.toString();
    if (sec < 10) {
        secText = '0' + secText;
    }

    let minText = min.toString();
    if (hour > 0 && min < 10) {
        minText = '0' + minText;
    }

    return ((hour == 0) ? '' : (hour + ':')) + minText + ':' + secText;
}
////////////////////////////////////////

////////////////////////////////////////
export function changeColor(elem: HTMLElement, color: string) {
    removeClass(elem, 'color-red');
    removeClass(elem, 'color-green');
    removeClass(elem, 'color-orange');
    addClass(elem, 'color-' + color);
}
////////////////////////////////////////

////////////////////////////////////////
export function imageProtection(elem: HTMLElement) {
    removeRightClick(elem);
    addEventListener(elem, 'dragstart', e => {
        e.preventDefault();
    });
    addEventListener(elem, 'touchforcechange', e => {
        const event = e as TouchEvent;
        if (event.changedTouches[0] !== undefined && event.changedTouches[0].force > 0.1) {
            event.preventDefault();
        }
    });

    addEventListener(elem, 'touchstart', e => {
        const event = e as TouchEvent;
        if (event.changedTouches[0] !== undefined && event.changedTouches[0].force > 0.1) {
            event.preventDefault();
        }
    });
}
////////////////////////////////////////

////////////////////////////////////////
export function concatenateSignedURL(url: string, credentials: CDNCredentials.CDNCredentials, resourceURLOverride?: string) {
    let policyString: string;
    if (credentials.Policy !== undefined) {
        const policy = credentials['Policy'];
        policy['Statement'][0]['Resource'] = (resourceURLOverride === undefined) ? url : resourceURLOverride;
        policyString = JSON.stringify(policy);
        policyString = w.btoa(policyString);
        policyString = policyString.replace(/\+/g, "-");
        policyString = policyString.replace(/=/g, "_");
        policyString = policyString.replace(/\//g, "~");
        policyString = 'Policy=' + policyString
    } else {
        policyString = 'Expires=' + credentials['Expires']
    }
    return url + '?' + policyString + '&Signature=' + credentials['Signature'] + '&Key-Pair-Id=' + credentials['Key-Pair-Id'];
}
////////////////////////////////////////

////////////////////////////////////////
export function encodeCFURIComponent(uri: string) {
    return encodeURIComponent(uri).replace(/%20/g, "+");
}
////////////////////////////////////////

////////////////////////////////////////
export function disableInput(inputElement: HTMLInputElement, disabled: boolean) {
    inputElement.disabled = disabled;
    if (disabled) {
        addClass(getParent(inputElement), 'disabled');
    } else {
        removeClass(getParent(inputElement), 'disabled');
    }
}
////////////////////////////////////////

////////////////////////////////////////
export function clearCookies() {
    if (getHref() != TOP_URL + '/message' && !DEVELOPMENT) {
        deleteCookie('local-message-param');
    }
    if (getHref() != TOP_URL + '/image' && !DEVELOPMENT) {
        deleteCookie('local-image-param');
    }
}
////////////////////////////////////////

////////////////////////////////////////
export function cssVarWrapper() {
    const showErrorMessage = !getHref().endsWith('/message') && !DEVELOPMENT;
    import(
        /* webpackExports: ["default"] */
        'css-vars-ponyfill'
    ).then(({ default: cssVars }) => {
        cssVars({
            onError: function (errorMessage) {
                if (showErrorMessage) {
                    showMessage(cssVarError(errorMessage));
                }
            },
            onWarning: function (errorMessage) {
                console.log(errorMessage);
            },
            include: "link[rel=stylesheet]",
            exclude: '[href*="/font/"]'
        });
    }).catch((e) => {
        if (showErrorMessage) {
            showMessage(moduleImportError(e));
        }
    });
}
////////////////////////////////////////

////////////////////////////////////////
import type Sha512 from 'node-forge/lib/sha512';
let sha512: typeof Sha512 | null = null;
export async function hashPassword(password: string) {
    if (sha512 === null) {
        try {
            ({ default: sha512 } = await import(
                /* webpackExports: ["default"] */
                'node-forge/lib/sha512'
            ));
        } catch (e) {
            showMessage(moduleImportError(e));
        }
    }

    const hash = (sha512 as typeof Sha512).sha256.create();
    hash.update(password);
    return hash.digest().toHex();
}
////////////////////////////////////////

////////////////////////////////////////
export function removeRightClick(elem: HTMLElement) {
    addEventListener(elem, 'contextmenu', event => event.preventDefault());
}
////////////////////////////////////////

////////////////////////////////////////
export function scrollToHash(paddingTop: boolean) {
    const scrollID = getHash();
    if (scrollID !== '') {
        const elem = getByIdNative(scrollID);
        if (elem !== null) {
            setTimeout(function () {
                window.scrollBy(0, elem.getBoundingClientRect().top - (paddingTop ? 46 : 0));
            }, 500); //Give UI some time to load.
        }
    }
}
////////////////////////////////////////

////////////////////////////////////////
export function checkBaseURL(baseURL: string) {
    const href = getHref();
    let protocol = '';
    if (baseURL.startsWith('https://')) {
        protocol = 'https://';
    } else if (baseURL.startsWith('http://')) {
        protocol = 'http://';
    }
    const baseURLWithoutProtocol = baseURL.substring(protocol.length);
    if (!baseURLWithoutProtocol.includes('/')) { // If is a root URL
        if (href === baseURL + '/' || href.startsWith(baseURL + '/?') || href.startsWith(baseURL + '/#')) {
            return true;
        }
    }
    return href === baseURL || href.startsWith(baseURL + '?') || href.startsWith(baseURL + '#');
}