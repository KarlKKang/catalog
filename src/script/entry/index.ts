import 'core-js';
import { body as innerBody, getBaseURL, w, addEventListenerOnce, setTitle, changeURL, getFullURL, deregisterAllEventTargets, replaceChildren, d, addClass, removeClass, createDivElement, appendChild, createElement, html, setClass } from '../module/dom';
import { TOP_DOMAIN, TOP_URL } from '../module/env/constant';
import { objectKeyExists } from '../module/common/pure';
import { addTimeout, removeAllTimers } from '../module/timer';
import * as messagePageScript from '../message';
import { showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
import { STATE_TRACKER, customPopStateHandler, pgid, setCustomPopStateHandler, setPgid, setRedirect, type ShowPageFunc } from '../module/global';
import '../../font/dist/NotoSansJP/NotoSansJP-Light.css';
import '../../font/dist/NotoSansJP/NotoSansJP-Medium.css';
import * as styles from '../../css/common.module.scss';
import { enableTransition, setMinHeight, setOpacity, setVisibility, setWidth } from '../module/style';
import { CSS_UNIT } from '../module/style/value';
import { consolePageTitle, emailChangePageTitle, infoPageTitle, loginPageTitle, myAccountPageTitle, newsPageTitle, notFoundPageTitle, passwordResetPageTitle, registerPageTitle } from '../module/text/page_title';

type PageInitCallback = (showPage: ShowPageFunc) => void;
type PageScript = {
    default: PageInitCallback;
    offload?: () => void;
};
type PageScriptImport = Promise<PageScript>;

const enum PageProp {
    SCRIPT,
    TITLE,
    NATIVE_VIEWPORT,
    NO_THEME,
    SCRIPT_CACHED,
}
type Page = {
    [PageProp.SCRIPT]: () => PageScriptImport;
    [PageProp.TITLE]?: string;
    [PageProp.NATIVE_VIEWPORT]?: boolean;
    [PageProp.NO_THEME]?: boolean;
    [PageProp.SCRIPT_CACHED]?: PageScript;
};

type PageMap = {
    [key: string]: Page;
};

let body: HTMLElement;
const loadingBar = createDivElement();
addClass(loadingBar, styles.loadingBar);
let currentPageScript: PageScript | null = null;
let serviceWorkerModule: {
    default: (showPrompt: boolean) => void;
    offload: () => void;
} | null = null;
let loadingBarShown: boolean = false;

const page404: Page = {
    [PageProp.SCRIPT]: () => import('../404'),
    [PageProp.TITLE]: notFoundPageTitle,
};

const pages: PageMap = {
    '': {
        [PageProp.SCRIPT]: () => import('../home'),
    },
    'confirm_new_email': {
        [PageProp.SCRIPT]: () => import('../confirm_new_email'),
        [PageProp.TITLE]: emailChangePageTitle,
    },
    'console': {
        [PageProp.SCRIPT]: () => import('../console'),
        [PageProp.TITLE]: consolePageTitle,
        [PageProp.NO_THEME]: true,
    },
    'image': {
        [PageProp.SCRIPT]: () => import('../image'),
        [PageProp.NO_THEME]: true,
        [PageProp.NATIVE_VIEWPORT]: true,
    },
    'info': {
        [PageProp.SCRIPT]: () => import('../info'),
        [PageProp.TITLE]: infoPageTitle,
    },
    'message': {
        [PageProp.SCRIPT]: () => Promise.resolve(messagePageScript),
        [PageProp.SCRIPT_CACHED]: messagePageScript,
    },
    'my_account': {
        [PageProp.SCRIPT]: () => import('../my_account'),
        [PageProp.TITLE]: myAccountPageTitle,
    },
    'new_email': {
        [PageProp.SCRIPT]: () => import('../new_email'),
        [PageProp.TITLE]: emailChangePageTitle,
    },
    'register': {
        [PageProp.SCRIPT]: () => import('../register'),
        [PageProp.TITLE]: registerPageTitle,
    },
    'special_register': {
        [PageProp.SCRIPT]: () => import('../special_register'),
        [PageProp.TITLE]: registerPageTitle,
    },
    'login': {
        [PageProp.SCRIPT]: () => import('../login'),
        [PageProp.TITLE]: loginPageTitle,
    },
    'request_password_reset': {
        [PageProp.SCRIPT]: () => import('../request_password_reset'),
        [PageProp.TITLE]: passwordResetPageTitle,
    },
    'password_reset': {
        [PageProp.SCRIPT]: () => import('../password_reset'),
        [PageProp.TITLE]: passwordResetPageTitle,
    },
};
const directories: PageMap = {
    'bangumi': {
        [PageProp.SCRIPT]: () => import('../bangumi'),
    },
    'news': {
        [PageProp.SCRIPT]: () => import('../news'),
        [PageProp.TITLE]: newsPageTitle,
    },
};

function load(url: string, withoutHistory: boolean | null = false) {
    let baseURL = getBaseURL(url);

    if (baseURL === TOP_URL) {
        baseURL += '/';
    }

    if (baseURL.startsWith(TOP_URL + '/')) {
        let pageName = baseURL.substring(TOP_URL.length + 1);
        if (objectKeyExists(pageName, pages)) {
            const page = pages[pageName]!;
            loadPage(url, withoutHistory, page);
            return;
        }
        pageName = pageName.substring(0, pageName.indexOf('/'));
        if (objectKeyExists(pageName, directories)) {
            const page = directories[pageName]!;
            loadPage(url, withoutHistory, page);
            return;
        }
    }

    loadPage(url, withoutHistory, page404);
}

function offloadCurrentPage() {
    if (currentPageScript === null) {
        return;
    }
    currentPageScript.offload?.();
    deregisterAllEventTargets();
    removeAllTimers();
    if (serviceWorkerModule !== null) {
        serviceWorkerModule.offload();
    }
    replaceChildren(innerBody);
    setClass(innerBody, '');
    setCustomPopStateHandler(null);
}

async function loadPage(url: string, withoutHistory: boolean | null, page: Page) {
    offloadCurrentPage(); // This prepare should be just before updating pgid. Otherwise offloaded pages may be reinitialized by themselves.
    setMinHeight(html, 0, CSS_UNIT.PX); // This is needed because the page may not be scrolled to top when there's `safe-area-inset` padding.

    if (withoutHistory !== null) {
        changeURL(url, withoutHistory);
    }
    setTitle((page[PageProp.TITLE] === undefined ? '' : (page[PageProp.TITLE] + ' | ')) + TOP_DOMAIN + (DEVELOPMENT ? ' (alpha)' : ''));
    removeClass(body, styles.noTheme);
    setViewport(false);

    const newPgid = {};
    setPgid(newPgid);

    let loadingBarWidth: number = 33;
    if (loadingBarShown) {
        setWidth(loadingBar, loadingBarWidth, CSS_UNIT.PERCENT);
    } else {
        addTimeout(() => {
            if (loadingBarWidth === 100) { // This check isn't necessarily needed since `requestLoadingBarAnimationFrame` will check it anyway. It's here just to avoid unnecessary `requestAnimationFrame` calls.
                return;
            }
            const requestLoadingBarAnimationFrame = (callback: () => void) => {
                w.requestAnimationFrame(() => {
                    if (loadingBarWidth === 100 || pgid !== newPgid) {
                        return;
                    }
                    callback();
                });
            };
            requestLoadingBarAnimationFrame(() => {
                enableTransition(loadingBar, false);
                requestLoadingBarAnimationFrame(() => {
                    setVisibility(loadingBar, true);
                    setOpacity(loadingBar, 1);
                    setWidth(loadingBar, 0, CSS_UNIT.PERCENT);
                    requestLoadingBarAnimationFrame(() => {
                        enableTransition(loadingBar, true);
                        requestLoadingBarAnimationFrame(() => {
                            setWidth(loadingBar, loadingBarWidth, CSS_UNIT.PERCENT);
                            loadingBarShown = true;
                        });
                    });
                });
            });
        }, 300);
    }

    if (page[PageProp.SCRIPT_CACHED] === undefined) {
        if (DEVELOPMENT) {
            console.log('First time loading page: ' + url);
        }
        const scriptImportPromise = page[PageProp.SCRIPT]();
        try {
            page[PageProp.SCRIPT_CACHED] = await scriptImportPromise;
        } catch (e) {
            if (pgid === newPgid) {
                showMessage(moduleImportError);
            }
            throw e;
        }
        if (pgid !== newPgid) {
            return;
        }
    }

    if (loadingBarShown) {
        setWidth(loadingBar, 67, CSS_UNIT.PERCENT);
    } else {
        loadingBarWidth = 67;
    }

    currentPageScript = page[PageProp.SCRIPT_CACHED];
    page[PageProp.SCRIPT_CACHED].default(
        () => {
            if (pgid !== newPgid) {
                return;
            }

            const isStandardStyle = !page[PageProp.NO_THEME] && !page[PageProp.NATIVE_VIEWPORT];
            setMinHeight(html, null);
            page[PageProp.NO_THEME] && addClass(body, styles.noTheme);
            page[PageProp.NATIVE_VIEWPORT] && setViewport(true);

            if (serviceWorkerModule === null) {
                import('./service_worker').then((module) => {
                    if (pgid !== newPgid) {
                        return;
                    }
                    serviceWorkerModule = module;
                    serviceWorkerModule.default(isStandardStyle);
                }); // No need to catch error since this module is not critical.
            } else {
                serviceWorkerModule.default(isStandardStyle);
            }

            loadingBarWidth = 100;
            if (loadingBarShown) {
                const hideLoadingBar = () => {
                    loadingBarShown = false;
                    setVisibility(loadingBar, false);
                    setOpacity(loadingBar, 0);
                };
                if (isStandardStyle) {
                    setWidth(loadingBar, 100, CSS_UNIT.PERCENT);
                    addTimeout(hideLoadingBar, 300);
                } else {
                    hideLoadingBar(); // Directly hide the loading bar for pages with non-standard style.
                }
            }
        }
    );
}

function setViewport(native: boolean) {
    let viewportTag = d.querySelector('meta[name=viewport]') as HTMLMetaElement;
    if (!viewportTag) {
        viewportTag = createElement('meta') as HTMLMetaElement;
        viewportTag.name = 'viewport';
        appendChild(d.head, viewportTag);
    }
    let viewpartTagContent = 'width=device-width, initial-scale=1';
    if (native) {
        addClass(html, styles.nativeViewport);
    } else {
        viewpartTagContent += ', viewport-fit=cover';
        removeClass(html, styles.nativeViewport);
    }
    viewportTag.content = viewpartTagContent;
}

const fullURL = getFullURL();
changeURL(fullURL, true);
if (history.scrollRestoration !== undefined) {
    history.scrollRestoration = 'manual';
}
addEventListenerOnce(w, 'load', () => {
    body = d.body;
    appendChild(body, loadingBar);
    appendChild(body, innerBody);
    setRedirect(load);
    load(fullURL, null);
    w.addEventListener('popstate', (state) => {
        if (state.state === STATE_TRACKER) { // Only handle tracked popstate events. In some cases, like using `window.open`, browsers may inject their own states before the tracked state.
            if (customPopStateHandler === null) {
                load(getFullURL(), null);
                if (DEVELOPMENT) {
                    console.log('popstate handled by the loader.');
                }
            } else {
                customPopStateHandler();
                if (DEVELOPMENT) {
                    console.log('popstate handled by the page.');
                }
            }
        } else {
            if (DEVELOPMENT) {
                console.log('popstate untracked.');
            }
        }
    });
});
