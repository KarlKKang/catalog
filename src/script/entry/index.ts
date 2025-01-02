import 'core-js';
import '../../css/common.scss';
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
import { w } from '../module/dom/window';
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
import { loadingBar as loadingBarClass } from '../../css/loading_bar.module.scss';
import { enableTransition } from '../module/style/transition';
import { setVisibility } from '../module/style/visibility';
import { setOpacity } from '../module/style/opacity';
import { setWidth } from '../module/style/width';
import { CSS_UNIT } from '../module/style/value/unit';
import { consolePageTitle, emailChangePageTitle, infoPageTitle, loginPageTitle, myAccountPageTitle, newsPageTitle, notFoundPageTitle, passwordResetPageTitle, cnRoutesPageTitle, registerPageTitle } from '../module/text/page_title';
import { importModule } from '../module/import_module';
import { BANGUMI_ROOT_URI, CONFIRM_NEW_EMAIL_URI, CONSOLE_URI, IMAGE_URI, INFO_URI, LOGIN_URI, MESSAGE_URI, MY_ACCOUNT_URI, NEWS_ROOT_URI, NEW_EMAIL_URI, PASSWORD_RESET_URI, CN_ROUTES_URI, REGISTER_URI, REQUEST_PASSWORD_RESET_URI, SPECIAL_REGISTER_URI, TOP_URI } from '../module/env/uri';
import { clearSessionStorage } from '../module/session_storage/clear';
import { offloadXhr } from '../module/xhr/offload';
import { offloadEventListeners } from '../module/event_listener/offload';
import { offloadTimers } from '../module/timer/offload';
import { max, min } from '../module/math';
import { offloadAnimationFrames } from '../module/animation_frame/offload';
import { addAnimationFrame } from '../module/animation_frame/add';
import { addTimeoutNative } from '../module/timer/add/native/timeout';
import { Timeout } from '../module/timer/type';
import { AnimationFrame } from '../module/animation_frame/type';
import { removeTimeout } from '../module/timer/remove/timeout';
import { removeAnimationFrame } from '../module/animation_frame/remove';
import { offloadFileReader } from '../module/file_reader/offload';
import { scrollToTop } from '../module/dom/scroll/to_top';
import { setSmoothScroll } from '../module/style/smooth_scroll';
import { setOgUrl } from '../module/dom/document/og/url/set';

type PageInitCallback = (showPage: ShowPageFunc) => void;
interface PageScript {
    default: PageInitCallback;
}
type PageScriptImport = Promise<PageScript>;

const enum PageProp {
    SCRIPT,
    TITLE,
    SCRIPT_CACHED,
    SESSION_STORAGE,
    CUSTOM_CANONICAL_URL,
}
interface Page {
    [PageProp.SCRIPT]: () => PageScriptImport;
    [PageProp.TITLE]?: string;
    [PageProp.SCRIPT_CACHED]?: PageScript;
    [PageProp.SESSION_STORAGE]?: boolean;
    [PageProp.CUSTOM_CANONICAL_URL]?: boolean;
}

const loadingBar = createDivElement();
addClass(loadingBar, loadingBarClass);
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
        [PageProp.SESSION_STORAGE]: true,
        [PageProp.CUSTOM_CANONICAL_URL]: true,
    },
    [INFO_URI]: {
        [PageProp.SCRIPT]: () => import('../info'),
        [PageProp.TITLE]: infoPageTitle,
    },
    [MESSAGE_URI]: {
        [PageProp.SCRIPT]: () => Promise.resolve(messagePageScript),
        [PageProp.SCRIPT_CACHED]: messagePageScript,
        [PageProp.CUSTOM_CANONICAL_URL]: true,
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
        [PageProp.CUSTOM_CANONICAL_URL]: true,
    },
    [NEWS_ROOT_URI]: {
        [PageProp.SCRIPT]: () => import('../news'),
        [PageProp.TITLE]: newsPageTitle,
        [PageProp.CUSTOM_CANONICAL_URL]: true,
    },
};

function load(url: string, withoutHistory: boolean | null = false) {
    let uri = parseURI(url);
    if (uri === null) {
        loadPage(url, withoutHistory, page404, getFullPath());
        return;
    }

    if (objectKeyExists(uri, pages)) {
        const page = pages[uri];
        loadPage(url, withoutHistory, page, uri);
        return;
    }
    uri = uri.substring(0, uri.indexOf('/', 1) + 1);
    if (objectKeyExists(uri, directories)) {
        const page = directories[uri];
        loadPage(url, withoutHistory, page, uri);
        return;
    }

    loadPage(url, withoutHistory, page404, getFullPath());
}

async function loadPage(url: string, withoutHistory: boolean | null, page: Page, canonicalUri: string) {
    // Offloading functions should be called just before updating pgid. Otherwise offloaded pages may be reinitialized by themselves.
    offload();
    offloadXhr();
    offloadFileReader();
    offloadEventListeners();
    offloadTimers();
    offloadAnimationFrames();
    replaceChildren(body);
    setClass(body, '');

    if (withoutHistory !== null) {
        changeURL(url, withoutHistory);
    }
    setOgUrl(page[PageProp.CUSTOM_CANONICAL_URL] === true ? TOP_URI : canonicalUri);
    setTitle((page[PageProp.TITLE] === undefined ? '' : (page[PageProp.TITLE] + ' | ')) + TOP_DOMAIN + (DEVELOPMENT ? ' (alpha)' : ''));

    if (page[PageProp.SESSION_STORAGE] !== true) {
        clearSessionStorage();
    }

    const newPgid = {};
    setPgid(newPgid);

    let showLoadingBarAnimationTimeout: Timeout | null = null;
    let showLoadingBarAnimationFrame: AnimationFrame | null = null;
    const stopShowLoadingBarAnimation = () => {
        if (showLoadingBarAnimationTimeout !== null) {
            removeTimeout(showLoadingBarAnimationTimeout);
            showLoadingBarAnimationTimeout = null;
        }
        if (showLoadingBarAnimationFrame !== null) {
            removeAnimationFrame(showLoadingBarAnimationFrame);
            showLoadingBarAnimationFrame = null;
        }
    };
    let loadingBarWidth = 33;
    if (loadingBarShown) {
        setWidth(loadingBar, loadingBarWidth, CSS_UNIT.PERCENT);
    } else {
        showLoadingBarAnimationTimeout = addTimeout(() => {
            showLoadingBarAnimationTimeout = null;
            const requestLoadingBarAnimationFrame = (callback: () => void) => {
                showLoadingBarAnimationFrame = addAnimationFrame(() => {
                    showLoadingBarAnimationFrame = null;
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

    const showPage = () => {
        if (pgid !== newPgid) {
            return;
        }

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

        stopShowLoadingBarAnimation();
        loadingBarWidth = 100;
        if (loadingBarShown) {
            setWidth(loadingBar, 100, CSS_UNIT.PERCENT);
            addTimeout(() => {
                loadingBarShown = false;
                setVisibility(loadingBar, false);
                setOpacity(loadingBar, 0);
            }, 300);
        }
    };

    const pageScript = page[PageProp.SCRIPT_CACHED];

    // This is needed to ensure the empty page is actually rendered before the next page is shown.
    // This resolves some weird issues on iOS, especially with safe-area-inset-top.
    addAnimationFrame(() => {
        setSmoothScroll(false);
        addAnimationFrame(() => {
            scrollToTop(); // This has to be in the next frame, otherwise the safe-area-inset-top may not be scrolled in iOS PWA.
            setSmoothScroll(true);
            pageScript.default(showPage);
        });
    });
}

function importFont(delay: number) {
    addTimeoutNative(async () => {
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
            './service_worker',
        );
    } catch (e) {
        console.error(e);
        return new Promise<ServiceWorkerModule>((resolve) => {
            addTimeoutNative(() => {
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
const windowAddEventListener = w.addEventListener;
windowAddEventListener('load', () => {
    const nativeBody = d.body;
    appendChild(nativeBody, loadingBar);
    appendChild(nativeBody, body);
    setRedirect(load);
    load(fullPath, null);
    importFont(0);
    windowAddEventListener('popstate', (state) => {
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
