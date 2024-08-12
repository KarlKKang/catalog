import 'core-js';
import { createDivElement } from '../module/dom/element/div/create';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { setClass } from '../module/dom/class/set';
import { setTitle } from '../module/dom/document/title/set';
import { d } from '../module/dom/document';
import { parseURI } from '../module/dom/location/parse/uri';
import { getFullPath } from '../module/dom/location/get/full_path';
import { changeURL } from '../module/dom/location/change';
import { html } from '../module/dom/html';
import { w } from '../module/dom/window';
import { addEventListenerOnce } from '../module/event_listener/add/once';
import { body } from '../module/dom/body';
import { TOP_DOMAIN } from '../module/env/domain';
import { addTimeout } from '../module/timer/add/timeout';
import * as messagePageScript from '../message';
import { offload } from '../module/global/offload';
import { type ShowPageFunc } from '../module/global/type';
import { customPopStateHandler } from '../module/global/pop_state/custom_handler';
import { STATE_TRACKER } from '../module/global/pop_state/tracker';
import { setRedirect } from '../module/global/redirect';
import { pgid, setPgid } from '../module/global/pgid';
import * as styles from '../../css/common.module.scss';
import { enableTransition } from '../module/style/transition';
import { setVisibility } from '../module/style/visibility';
import { setOpacity } from '../module/style/opacity';
import { setMinHeight } from '../module/style/min_height';
import { setWidth } from '../module/style/width';
import { CSS_UNIT } from '../module/style/value/unit';
import { consolePageTitle, emailChangePageTitle, infoPageTitle, loginPageTitle, myAccountPageTitle, newsPageTitle, notFoundPageTitle, passwordResetPageTitle, cnRoutesPageTitle, registerPageTitle } from '../module/text/page_title';
import { importModule } from '../module/import_module';
import { BANGUMI_ROOT_URI, CONFIRM_NEW_EMAIL_URI, CONSOLE_URI, IMAGE_URI, INFO_URI, LOGIN_URI, MESSAGE_URI, MY_ACCOUNT_URI, NEWS_ROOT_URI, NEW_EMAIL_URI, PASSWORD_RESET_URI, CN_ROUTES_URI, REGISTER_URI, REQUEST_PASSWORD_RESET_URI, SPECIAL_REGISTER_URI, TOP_URI } from '../module/env/uri';
import { min } from '../module/math/min';
import { max } from '../module/math/max';

type PageInitCallback = (showPage: ShowPageFunc) => void;
interface PageScript {
    default: PageInitCallback;
}
type PageScriptImport = Promise<PageScript>;

const enum PageProp {
    SCRIPT,
    TITLE,
    SCRIPT_CACHED,
}
interface Page {
    [PageProp.SCRIPT]: () => PageScriptImport;
    [PageProp.TITLE]?: string;
    [PageProp.SCRIPT_CACHED]?: PageScript;
}

const loadingBar = createDivElement();
addClass(loadingBar, styles.loadingBar);
interface ServiceWorkerModule {
    default: () => void;
}
let serviceWorkerModule: ServiceWorkerModule | null = null;
let serviceWorkerModulePromise: Promise<ServiceWorkerModule> | null = null;
let loadingBarShown = false;

const page404 = {
    [PageProp.SCRIPT]: () => import('../404'),
    [PageProp.TITLE]: notFoundPageTitle,
};
const pages = {
    [TOP_URI]: {
        [PageProp.SCRIPT]: () => import('../home'),
    },
    [CONFIRM_NEW_EMAIL_URI]: {
        [PageProp.SCRIPT]: () => import('../confirm_new_email'),
        [PageProp.TITLE]: emailChangePageTitle,
    },
    [CONSOLE_URI]: {
        [PageProp.SCRIPT]: () => import('../console'),
        [PageProp.TITLE]: consolePageTitle,
    },
    [IMAGE_URI]: {
        [PageProp.SCRIPT]: () => import('../image'),
    },
    [INFO_URI]: {
        [PageProp.SCRIPT]: () => import('../info'),
        [PageProp.TITLE]: infoPageTitle,
    },
    [MESSAGE_URI]: {
        [PageProp.SCRIPT]: () => Promise.resolve(messagePageScript),
        [PageProp.SCRIPT_CACHED]: messagePageScript,
    },
    [MY_ACCOUNT_URI]: {
        [PageProp.SCRIPT]: () => import('../my_account'),
        [PageProp.TITLE]: myAccountPageTitle,
    },
    [NEW_EMAIL_URI]: {
        [PageProp.SCRIPT]: () => import('../new_email'),
        [PageProp.TITLE]: emailChangePageTitle,
    },
    [REGISTER_URI]: {
        [PageProp.SCRIPT]: () => import('../register'),
        [PageProp.TITLE]: registerPageTitle,
    },
    [SPECIAL_REGISTER_URI]: {
        [PageProp.SCRIPT]: () => import('../special_register'),
        [PageProp.TITLE]: registerPageTitle,
    },
    [LOGIN_URI]: {
        [PageProp.SCRIPT]: () => import('../login'),
        [PageProp.TITLE]: loginPageTitle,
    },
    [REQUEST_PASSWORD_RESET_URI]: {
        [PageProp.SCRIPT]: () => import('../request_password_reset'),
        [PageProp.TITLE]: passwordResetPageTitle,
    },
    [PASSWORD_RESET_URI]: {
        [PageProp.SCRIPT]: () => import('../password_reset'),
        [PageProp.TITLE]: passwordResetPageTitle,
    },
    [CN_ROUTES_URI]: {
        [PageProp.SCRIPT]: () => import('../cn_routes'),
        [PageProp.TITLE]: cnRoutesPageTitle,
    },
};
const directories = {
    [BANGUMI_ROOT_URI]: {
        [PageProp.SCRIPT]: () => import('../bangumi'),
    },
    [NEWS_ROOT_URI]: {
        [PageProp.SCRIPT]: () => import('../news'),
        [PageProp.TITLE]: newsPageTitle,
    },
};

function load(url: string, withoutHistory: boolean | null = false) {
    let uri = parseURI(url);
    if (uri === null) {
        loadPage(url, withoutHistory, page404);
        return;
    }

    if (objectKeyExists(uri, pages)) {
        const page = pages[uri];
        loadPage(url, withoutHistory, page);
        return;
    }
    uri = uri.substring(0, uri.indexOf('/', 1) + 1);
    if (objectKeyExists(uri, directories)) {
        const page = directories[uri];
        loadPage(url, withoutHistory, page);
        return;
    }

    loadPage(url, withoutHistory, page404);
}

function offloadCurrentPage() {
    offload();
    replaceChildren(body);
    setClass(body, '');
}

async function loadPage(url: string, withoutHistory: boolean | null, page: Page) {
    offloadCurrentPage(); // This prepare should be just before updating pgid. Otherwise offloaded pages may be reinitialized by themselves.
    setMinHeight(html, 0, CSS_UNIT.PX); // This is needed because the page may not be scrolled to top when there's `safe-area-inset` padding.

    if (withoutHistory !== null) {
        changeURL(url, withoutHistory);
    }
    setTitle((page[PageProp.TITLE] === undefined ? '' : (page[PageProp.TITLE] + ' | ')) + TOP_DOMAIN + (DEVELOPMENT ? ' (alpha)' : ''));

    const newPgid = {};
    setPgid(newPgid);

    let loadingBarWidth = 33;
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
        page[PageProp.SCRIPT_CACHED] = await importModule(page[PageProp.SCRIPT]);
        if (pgid !== newPgid) {
            return;
        }
    }

    if (loadingBarShown) {
        setWidth(loadingBar, 67, CSS_UNIT.PERCENT);
    } else {
        loadingBarWidth = 67;
    }

    page[PageProp.SCRIPT_CACHED].default(
        () => {
            if (pgid !== newPgid) {
                return;
            }

            setMinHeight(html, null);

            if ('serviceWorker' in navigator) {
                if (serviceWorkerModule !== null) {
                    serviceWorkerModule.default();
                } else {
                    if (serviceWorkerModulePromise === null) {
                        serviceWorkerModulePromise = getServiceWorkerModulePromise();
                    }
                    serviceWorkerModulePromise.then((module) => {
                        serviceWorkerModule = module;
                        if (pgid !== newPgid) {
                            return;
                        }
                        serviceWorkerModule.default();
                    }); // No need to catch error since this module is not critical.
                }
            }

            loadingBarWidth = 100;
            if (loadingBarShown) {
                setWidth(loadingBar, 100, CSS_UNIT.PERCENT);
                addTimeout(() => {
                    loadingBarShown = false;
                    setVisibility(loadingBar, false);
                    setOpacity(loadingBar, 0);
                }, 300);
            }
        },
    );
}

function importFont(delay: number) {
    setTimeout(async () => {
        try {
            await import('./font');
        } catch (e) {
            importFont(min(5000, max(500, delay * 2)));
            throw e;
        }
    }, delay);
}

async function getServiceWorkerModulePromise(retryTimeout = 500): Promise<ServiceWorkerModule> {
    try {
        return await import(
            /* webpackExports: ["default"] */
            './service_worker'
        );
    } catch (e) {
        console.error(e);
        return new Promise<ServiceWorkerModule>((resolve) => {
            setTimeout(() => {
                resolve(getServiceWorkerModulePromise(min(retryTimeout * 2, 5000)));
            }, retryTimeout);
        });
    }
}

function objectKeyExists<T extends object>(key: PropertyKey, obj: T): key is keyof T {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

const fullPath = getFullPath();
changeURL(fullPath, true);
if (history.scrollRestoration !== undefined) {
    history.scrollRestoration = 'manual';
}
addEventListenerOnce(w, 'load', () => {
    const nativeBody = d.body;
    appendChild(nativeBody, loadingBar);
    appendChild(nativeBody, body);
    setRedirect(load);
    load(fullPath, null);
    importFont(0);
    w.addEventListener('popstate', (state) => {
        if (state.state === STATE_TRACKER) { // Only handle tracked popstate events. In some cases, like using `window.open`, browsers may inject their own states before the tracked state.
            if (customPopStateHandler === null) {
                load(getFullPath(), null);
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
