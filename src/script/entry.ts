import 'core-js';
import { getBaseURL, w, addEventListener, addEventListenerOnce, setTitle, getBody, changeURL, getFullURL, deregisterAllEventTargets, replaceChildren, getById, d, addClass, removeClass, createParagraphElement, appendText, createButtonElement, createDivElement, appendChild } from './module/dom';
import { DOMAIN, TOP_DOMAIN, TOP_URL } from './module/env/constant';
import { objectKeyExists } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { addTimeout, removeAllTimers } from './module/timer';
import { popupWindowImport, destroy as destroyPopupWindow } from './module/popup_window';
import type { Workbox as WorkboxType } from 'workbox-window';
import * as messagePageScript from './message';
import { default as messagePageHTML } from '../html/message.html';
import { show as showMessage } from './module/message';
import { moduleImportError } from './module/message/template/param';
import { pgid, setPgid, setRedirect } from './module/global';

import '../font/dist/NotoSansJP/NotoSansJP-Light.css';
import '../font/dist/NotoSansJP/NotoSansJP-Medium.css';
import '../css/common.scss';
import '../css/message.scss';

const enum HTMLEntry {
    DEFAULT,
    NO_THEME,
}

type PageInitCallback = (showPage: ShowPageFunc) => void;
type PageScript = {
    default: PageInitCallback;
    offload?: () => void;
};
type PageScriptImport = Promise<PageScript>;

type Page = {
    script: () => PageScriptImport;
    style: () => Promise<any>[];
    html: () => Promise<{
        default: string;
    }>;
    html_entry: HTMLEntry;
    title?: string;
    id?: string;
    customPopState?: boolean;
};

type PageMap = {
    [key: string]: Page;
};

let body: HTMLElement | null = null;
let currentPage: {
    script: PageScript;
    html_entry: HTMLEntry;
} | null = null;

let swUpdateLastPromptTime: number = 0;
let serviceWorker: WorkboxType | null = null;
let serviceWorkerUpToDate: boolean = true;

let loadingBarShown: boolean = false;

const notoSansLightCss = () => import('../font/dist/NotoSans/NotoSans-Light.css');
const notoSansRegularCss = () => import('../font/dist/NotoSans/NotoSans-Regular.css');
const notoSansMediumCss = () => import('../font/dist/NotoSans/NotoSans-Medium.css');
const notoSansJPRegularCss = () => import('../font/dist/NotoSansJP/NotoSansJP-Regular.css');
const notoSansTCLightCss = () => import('../font/dist/NotoSansTC/NotoSansTC-Light.css');
const notoSansTCRegularCss = () => import('../font/dist/NotoSansTC/NotoSansTC-Regular.css');
const notoSansTCMediumCss = () => import('../font/dist/NotoSansTC/NotoSansTC-Medium.css');
const notoSansSCLightCss = () => import('../font/dist/NotoSansSC/NotoSansSC-Light.css');
const notoSansSCRegularCss = () => import('../font/dist/NotoSansSC/NotoSansSC-Regular.css');
const notoSansSCMediumCss = () => import('../font/dist/NotoSansSC/NotoSansSC-Medium.css');
const courierNewRegularCss = () => import('../font/dist/CourierNew/CourierNew-Regular.css');
const segMDL2Css = () => import('../font/dist/Segoe/SegMDL2.css');
const navBarCss = () => import('../css/nav_bar.scss');
const portalFormCss = () => import('../css/portal_form.scss');
const newsCss = () => import('../css/news.scss');
const registerCss = () => import('../css/register.scss');

const page404: Page = {
    script: () => import('./404'),
    style: () => [],
    html: () => Promise.resolve({ default: messagePageHTML }),
    html_entry: HTMLEntry.DEFAULT,
    title: '404',
    id: 'message',
};

const pages: PageMap = {
    '': {
        script: () => import('./index'),
        style: () => [
            notoSansTCLightCss(),
            notoSansSCLightCss(),
            notoSansLightCss(),
            navBarCss(),
            import('../css/index.scss'),
        ],
        html: () => import('../html/index.html'),
        html_entry: HTMLEntry.DEFAULT,
        id: 'top',
        customPopState: true,
    },
    'confirm_new_email': {
        script: () => import('./confirm_new_email'),
        style: () => [
            portalFormCss(),
        ],
        html: () => import('../html/confirm_new_email.html'),
        title: 'メールアドレス変更',
        html_entry: HTMLEntry.DEFAULT,
    },
    'console': {
        script: () => import('./console'),
        style: () => [
            notoSansTCLightCss(),
            notoSansSCLightCss(),
            import('../css/console.scss'),
        ],
        html: () => import('../html/console.html'),
        title: 'console',
        html_entry: HTMLEntry.NO_THEME,
    },
    'image': {
        script: () => import('./image'),
        style: () => [
            import('../css/image.scss'),
        ],
        html: () => import('../html/image.html'),
        html_entry: HTMLEntry.NO_THEME,
    },
    'info': {
        script: () => import('./info'),
        style: () => [
            notoSansLightCss(),
            notoSansRegularCss(),
            notoSansMediumCss(),
            notoSansJPRegularCss(),
            notoSansTCLightCss(),
            notoSansTCRegularCss(),
            notoSansTCMediumCss(),
            notoSansSCLightCss(),
            notoSansSCRegularCss(),
            notoSansSCMediumCss(),
            navBarCss(),
            newsCss(),
        ],
        html: () => import('../html/info.html'),
        title: 'ご利用ガイド',
        html_entry: HTMLEntry.DEFAULT,
        id: 'news',
    },
    'message': {
        script: () => Promise.resolve(messagePageScript),
        style: () => [],
        html: () => Promise.resolve({ default: messagePageHTML }),
        html_entry: HTMLEntry.DEFAULT,
    },
    'my_account': {
        script: () => import('./my_account'),
        style: () => [
            notoSansTCLightCss(),
            notoSansSCLightCss(),
            notoSansLightCss(),
            courierNewRegularCss(),
            navBarCss(),
            import('../css/my_account.scss'),
        ],
        html: () => import('../html/my_account.html'),
        title: 'マイページ',
        html_entry: HTMLEntry.DEFAULT,
    },
    'new_email': {
        script: () => import('./new_email'),
        style: () => [
            portalFormCss(),
        ],
        html: () => import('../html/new_email.html'),
        title: 'メールアドレス変更',
        html_entry: HTMLEntry.DEFAULT,
    },
    'register': {
        script: () => import('./register'),
        style: () => [
            notoSansLightCss(),
            notoSansTCLightCss(),
            notoSansSCLightCss(),
            portalFormCss(),
            registerCss(),
        ],
        html: () => import('../html/register.html'),
        title: '新規登録',
        html_entry: HTMLEntry.DEFAULT,
    },
    'special_register': {
        script: () => import('./special_register'),
        style: () => [
            portalFormCss(),
            registerCss(),
        ],
        html: () => import('../html/special_register.html'),
        title: '新規登録',
        html_entry: HTMLEntry.DEFAULT,
    },
    'login': {
        script: () => import('./login'),
        style: () => [
            portalFormCss(),
            import('../css/login.scss'),
        ],
        html: () => import('../html/login.html'),
        title: 'ログイン',
        html_entry: HTMLEntry.DEFAULT,
        id: 'login',
    },
    'request_password_reset': {
        script: () => import('./request_password_reset'),
        style: () => [
            portalFormCss(),
        ],
        html: () => import('../html/request_password_reset.html'),
        title: 'パスワード再発行',
        html_entry: HTMLEntry.DEFAULT,
    },
    'password_reset': {
        script: () => import('./password_reset'),
        style: () => [
            portalFormCss(),
        ],
        html: () => import('../html/password_reset.html'),
        title: 'パスワード再発行',
        html_entry: HTMLEntry.DEFAULT,
    },
};
const directories: PageMap = {
    'bangumi': {
        script: () => import('./bangumi'),
        style: () => [
            segMDL2Css(),
            courierNewRegularCss(),
            navBarCss(),
            import('../css/bangumi.scss'),
            import('../css/player.scss'),
        ],
        html: () => import('../html/bangumi.html'),
        html_entry: HTMLEntry.DEFAULT,
    },
    'news': {
        script: () => import('./news'),
        style: () => [
            notoSansLightCss(),
            notoSansRegularCss(),
            notoSansMediumCss(),
            notoSansJPRegularCss(),
            notoSansTCLightCss(),
            notoSansTCRegularCss(),
            notoSansTCMediumCss(),
            notoSansSCLightCss(),
            notoSansSCRegularCss(),
            notoSansSCMediumCss(),
            navBarCss(),
            newsCss(),
        ],
        html: () => import('../html/news.html'),
        title: 'お知らせ',
        html_entry: HTMLEntry.DEFAULT,
    },
};

setRedirect(load);
load(getFullURL());

function load(url: string, withoutHistory: boolean = false) {
    let baseURL = getBaseURL(url);

    if (baseURL === TOP_URL) {
        baseURL += '/';
    }

    if (baseURL.startsWith(TOP_URL + '/')) {
        let pageName = baseURL.substring(TOP_URL.length + 1);
        if (objectKeyExists(pageName, pages)) {
            const page = pages[pageName]!;
            loadPage(url, withoutHistory, pageName, page);
            return;
        }
        pageName = pageName.substring(0, pageName.indexOf('/'));
        if (objectKeyExists(pageName, directories)) {
            const page = directories[pageName]!;
            loadPage(url, withoutHistory, pageName, page);
            return;
        }
    }

    loadPage(url, withoutHistory, '404', page404);
}

function loadPagePrepare(url: string, withoutHistory: boolean) {
    if (currentPage === null) {
        return;
    }
    currentPage.script.offload?.();
    deregisterAllEventTargets();
    removeAllTimers();
    destroyPopupWindow();
    replaceChildren(getBody());
    changeURL(url, withoutHistory);
    return;
}

async function registerServiceWorker() { // This function should be called after setting the `currentScriptImportPromise`.
    if ('serviceWorker' in navigator) {
        const currentPgid = pgid;
        const showSkipWaitingPrompt = async (wb: WorkboxType) => {
            const popupWindowInitialize = await popupWindowImport();
            if (pgid !== currentPgid) {
                return;
            }

            const titleText = createParagraphElement();
            addClass(titleText, 'title');
            appendText(titleText, 'アップデートが利用可能です');

            const promptText = createParagraphElement();
            appendText(promptText, '今すぐインストールすると、ページが再読み込みされます。' + DOMAIN + 'の複数のタブを開いている場合、他のタブで問題が発生する可能性があります。後で手動でインストールすることもできます。その場合は、' + DOMAIN + 'のすべてのタブを閉じてから再読み込みしてください。');

            const updateButton = createButtonElement();
            addClass(updateButton, 'button');
            appendText(updateButton, 'インストール');
            const cancelButton = createButtonElement();
            addClass(cancelButton, 'button');
            appendText(cancelButton, '後で');
            const buttonFlexbox = createDivElement();
            addClass(buttonFlexbox, 'input-flexbox');
            appendChild(buttonFlexbox, updateButton);
            appendChild(buttonFlexbox, cancelButton);

            const hidePopupWindow = popupWindowInitialize(titleText, promptText, buttonFlexbox);

            const disableAllInputs = (disabled: boolean) => {
                updateButton.disabled = disabled;
                cancelButton.disabled = disabled;
            };
            addEventListener(updateButton, 'click', () => {
                disableAllInputs(true);
                if (serviceWorkerUpToDate) {
                    if (DEVELOPMENT) {
                        console.log('Service worker already up to date.');
                    }
                    w.location.reload();
                    return;
                }
                addEventListener(wb as unknown as EventTarget, 'controlling', () => {
                    w.location.reload();
                });
                wb.messageSkipWaiting();
            });
            addEventListener(cancelButton, 'click', () => {
                swUpdateLastPromptTime = new Date().getTime();
                hidePopupWindow();
            });
        };

        const addWaitingListener = (wb: WorkboxType) => {
            addEventListener(serviceWorker as unknown as EventTarget, 'waiting', () => {
                showSkipWaitingPrompt(wb);
            });
        };

        if (serviceWorker === null) {
            let Workbox: typeof WorkboxType;
            try {
                Workbox = (await import(
                    /* webpackExports: ["Workbox"] */
                    'workbox-window'
                )).Workbox;
            } catch (e) {
                if (pgid === currentPgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }
            if (pgid !== currentPgid) { // If a redirect has happened the new page will handle the registration.
                return;
            }
            serviceWorker = new Workbox('/sw.js');

            // These two event should never be removed.
            serviceWorker.addEventListener('waiting', () => {
                if (DEVELOPMENT) {
                    console.log('Service worker waiting.');
                }
                serviceWorkerUpToDate = false;
            });
            serviceWorker.addEventListener('controlling', () => {
                if (DEVELOPMENT) {
                    console.log('Service worker controlling.');
                }
                serviceWorkerUpToDate = true;
            });

            addWaitingListener(serviceWorker);
            serviceWorker.register();
        } else {
            if (swUpdateLastPromptTime < Date.now() - 24 * 60 * 60 * 1000) {
                if (serviceWorkerUpToDate) {
                    addWaitingListener(serviceWorker);
                    serviceWorker.update();
                } else {
                    showSkipWaitingPrompt(serviceWorker);
                }
            }
        }
    }
}

async function loadPage(url: string, withoutHistory: boolean, pageName: string, page: Page) {
    if (body === null) {
        addEventListenerOnce(w, 'load', () => {
            body = d.body;
            loadPage(url, withoutHistory, pageName, page);
        });
        return;
    }

    loadPagePrepare(url, withoutHistory); // This prepare should be just before updating pgid. Otherwise offloaded pages may be reinitialized by themselves.
    d.documentElement.style.minHeight = '0'; // This is needed because the page may not be scrolled to top when there's `safe-area-inset` padding.

    body.id = 'page-' + (page.id ?? pageName).replace('_', '-');
    setTitle((page.title === undefined ? '' : (page.title + ' | ')) + TOP_DOMAIN + (DEVELOPMENT ? ' (alpha)' : ''));
    const noThemeClassName = 'no-theme';
    page.html_entry === HTMLEntry.NO_THEME ? addClass(body, noThemeClassName) : removeClass(body, noThemeClassName);

    const scriptImportPromise = page.script();
    const styleImportPromises = page.style();
    const htmlImportPromise = page.html();

    const newPgid = {};
    setPgid(newPgid);

    addEventListener(w, 'popstate', () => {
        if (page.customPopState) {
            if (DEVELOPMENT) {
                console.log('popstate handled by the page.');
            }
            return;
        }
        load(getFullURL());
        if (DEVELOPMENT) {
            console.log('popstate handled by the loader.');
        }
    });

    let loadingBarWidth: number = 33;
    const loadingBar = getById('loading-bar');
    if (loadingBarShown) {
        loadingBar.style.width = loadingBarWidth + '%';
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
                loadingBar.style.transition = 'none';
                requestLoadingBarAnimationFrame(() => {
                    loadingBar.style.visibility = 'visible';
                    loadingBar.style.opacity = '1';
                    loadingBar.style.width = '0%';
                    requestLoadingBarAnimationFrame(() => {
                        loadingBar.style.removeProperty('transition');
                        requestLoadingBarAnimationFrame(() => {
                            loadingBar.style.width = loadingBarWidth + '%';
                            loadingBarShown = true;
                        });
                    });
                });
            });
        }, 300);
    }

    let script: Awaited<typeof scriptImportPromise>;
    try {
        script = await scriptImportPromise;
    } catch (e) {
        if (pgid === newPgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }

    if (pgid !== newPgid) {
        return;
    }

    currentPage = {
        script: script,
        html_entry: page.html_entry,
    };
    script.default(
        async (callback?: () => void) => {
            let html: Awaited<typeof htmlImportPromise>;
            try {
                [html] = await Promise.all([htmlImportPromise, ...styleImportPromises]);
            } catch (e) {
                if (pgid === newPgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }

            if (pgid !== newPgid) {
                return;
            }

            d.documentElement.style.removeProperty('min-height');
            getBody().innerHTML = html.default;
            registerServiceWorker();
            callback?.();

            loadingBarWidth = 100;
            if (loadingBarShown) {
                loadingBar.style.width = '100%';
                addTimeout(() => {
                    loadingBarShown = false;
                    loadingBar.style.visibility = 'hidden';
                    loadingBar.style.opacity = '0';
                }, 300);
            }
        }
    );
    if (loadingBarShown) {
        loadingBar.style.width = '67%';
    } else {
        loadingBarWidth = 67;
    }
}