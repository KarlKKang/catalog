import 'core-js';
import { getBaseURL, w, addEventListener, addEventListenerOnce, setTitle, getBody, changeURL, getFullURL, deregisterAllEventTargets, replaceChildren, getById, d, addClass, removeClass } from './module/dom';
import { TOP_DOMAIN, TOP_URL } from './module/env/constant';
import { objectKeyExists } from './module/common/pure';
import type { RedirectFunc } from './module/type/RedirectFunc';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { addTimeout, removeAllTimers } from './module/timer';

import '../css/entry.scss';

const enum HTMLEntry {
    DEFAULT,
    NO_THEME,
}

type PageInitCallback = (showPage: ShowPageFunc, redirect: RedirectFunc) => void;
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
let currentScriptImportPromise: PageScriptImport | null = null;
let currentPage: {
    script: PageScript;
    html_entry: HTMLEntry;
} | null = null;

const notoSansLightCss = () => import('../font/dist/NotoSans/NotoSans-Light.css');
const notoSansRegularCss = () => import('../font/dist/NotoSans/NotoSans-Regular.css');
const notoSansMediumCss = () => import('../font/dist/NotoSans/NotoSans-Medium.css');
const notoSansJPLightCss = () => import('../font/dist/NotoSansJP/NotoSansJP-Light.css');
const notoSansJPRegularCss = () => import('../font/dist/NotoSansJP/NotoSansJP-Regular.css');
const notoSansJPMediumCss = () => import('../font/dist/NotoSansJP/NotoSansJP-Medium.css');
const notoSansTCLightCss = () => import('../font/dist/NotoSansTC/NotoSansTC-Light.css');
const notoSansTCRegularCss = () => import('../font/dist/NotoSansTC/NotoSansTC-Regular.css');
const notoSansTCMediumCss = () => import('../font/dist/NotoSansTC/NotoSansTC-Medium.css');
const notoSansSCLightCss = () => import('../font/dist/NotoSansSC/NotoSansSC-Light.css');
const notoSansSCRegularCss = () => import('../font/dist/NotoSansSC/NotoSansSC-Regular.css');
const notoSansSCMediumCss = () => import('../font/dist/NotoSansSC/NotoSansSC-Medium.css');
const courierNewRegularCss = () => import('../font/dist/CourierNew/CourierNew-Regular.css');
const segMDL2Css = () => import('../font/dist/Segoe/SegMDL2.css');
const commonCss = () => import('../css/common.scss');
const navBarCss = () => import('../css/nav_bar.scss');
const portalFormCss = () => import('../css/portal_form.scss');
const newsCss = () => import('../css/news.scss');
const registerCss = () => import('../css/register.scss');
const messageCss = () => import('../css/message.scss');

const messagePage: Page = {
    script: () => import('./message'),
    style: () => [
        notoSansJPLightCss(),
        notoSansJPMediumCss(),
        commonCss(),
        messageCss(),
    ],
    html: () => import('../html/message.html'),
    html_entry: HTMLEntry.DEFAULT,
};

const page404: Page = {
    script: () => import('./404'),
    style: () => [
        notoSansJPLightCss(),
        notoSansJPMediumCss(),
        commonCss(),
        messageCss(),
    ],
    html: () => import('../html/404.html'),
    html_entry: HTMLEntry.DEFAULT,
    title: '404',
    id: 'message',
};

const pages: PageMap = {
    '': {
        script: () => import('./index'),
        style: () => [
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            notoSansTCLightCss(),
            notoSansSCLightCss(),
            notoSansLightCss(),
            commonCss(),
            navBarCss(),
            import('../css/index.scss'),
        ],
        html: () => import('../html/index.html'),
        html_entry: HTMLEntry.DEFAULT,
        id: 'top',
        customPopState: true,
    },
    '404': page404,
    'confirm_new_email': {
        script: () => import('./confirm_new_email'),
        style: () => [
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            commonCss(),
            portalFormCss(),
        ],
        html: () => import('../html/confirm_new_email.html'),
        title: 'メールアドレス変更',
        html_entry: HTMLEntry.DEFAULT,
    },
    'console': {
        script: () => import('./console'),
        style: () => [
            notoSansJPLightCss(),
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
            notoSansJPLightCss(),
            notoSansJPRegularCss(),
            notoSansJPMediumCss(),
            notoSansTCLightCss(),
            notoSansTCRegularCss(),
            notoSansTCMediumCss(),
            notoSansSCLightCss(),
            notoSansSCRegularCss(),
            notoSansSCMediumCss(),
            commonCss(),
            navBarCss(),
            newsCss(),
        ],
        html: () => import('../html/info.html'),
        title: 'ご利用ガイド',
        html_entry: HTMLEntry.DEFAULT,
        id: 'news',
    },
    'message': messagePage,
    'my_account': {
        script: () => import('./my_account'),
        style: () => [
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            notoSansTCLightCss(),
            notoSansSCLightCss(),
            notoSansLightCss(),
            courierNewRegularCss(),
            navBarCss(),
            commonCss(),
            import('../css/my_account.scss'),
        ],
        html: () => import('../html/my_account.html'),
        title: 'マイページ',
        html_entry: HTMLEntry.DEFAULT,
    },
    'new_email': {
        script: () => import('./new_email'),
        style: () => [
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            commonCss(),
            portalFormCss(),
        ],
        html: () => import('../html/new_email.html'),
        title: 'メールアドレス変更',
        html_entry: HTMLEntry.DEFAULT,
    },
    'register': {
        script: () => import('./register'),
        style: () => [
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            notoSansLightCss(),
            notoSansTCLightCss(),
            notoSansSCLightCss(),
            commonCss(),
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
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            commonCss(),
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
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            commonCss(),
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
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            commonCss(),
            portalFormCss(),
        ],
        html: () => import('../html/request_password_reset.html'),
        title: 'パスワード再発行',
        html_entry: HTMLEntry.DEFAULT,
    },
    'password_reset': {
        script: () => import('./password_reset'),
        style: () => [
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            commonCss(),
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
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            segMDL2Css(),
            navBarCss(),
            commonCss(),
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
            notoSansJPLightCss(),
            notoSansJPRegularCss(),
            notoSansJPMediumCss(),
            notoSansTCLightCss(),
            notoSansTCRegularCss(),
            notoSansTCMediumCss(),
            notoSansSCLightCss(),
            notoSansSCRegularCss(),
            notoSansSCMediumCss(),
            commonCss(),
            navBarCss(),
            newsCss(),
        ],
        html: () => import('../html/news.html'),
        title: 'お知らせ',
        html_entry: HTMLEntry.DEFAULT,
    },
};

load(getFullURL(), null);

function load(url: string, withoutHistory: boolean | null = false) {
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
        loadPage(url, withoutHistory, '404', page404);
    }
}

function loadPagePrepare(url: string, withoutHistory: boolean | null) { // Specifying `null` for `withoutHistory` indicates the current state will not be changed.
    const currentPageConst = currentPage;
    if (currentPageConst === null) {
        return true;
    }
    currentPageConst.script.offload?.();
    deregisterAllEventTargets();
    removeAllTimers();
    replaceChildren(getBody());
    changeURL(url, withoutHistory === true);
    return true;
}

function loadPage(url: string, withoutHistory: boolean | null, pageName: string, page: Page) {
    if (body === null) {
        addEventListenerOnce(w, 'load', () => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js');
            }
            body = d.body;
            loadPage(url, withoutHistory, pageName, page);
        });
        return;
    }

    if (!loadPagePrepare(url, withoutHistory)) { // This prepare should be just before currentScriptImportPromise. Otherwise offloaded pages may be reinitialized by themselves.
        return;
    }

    body.id = 'page-' + (page.id ?? pageName).replace('_', '-');
    setTitle((page.title === undefined ? '' : (page.title + ' | ')) + TOP_DOMAIN + (DEVELOPMENT ? ' (alpha)' : ''));
    const noThemeClassName = 'no-theme';
    page.html_entry === HTMLEntry.NO_THEME ? addClass(body, noThemeClassName) : removeClass(body, noThemeClassName);

    const scriptImportPromise = page.script();
    const styleImportPromises = page.style();
    const htmlImportPromise = page.html();
    currentScriptImportPromise = scriptImportPromise;

    addEventListener(w, 'popstate', () => {
        if (page.customPopState) {
            if (DEVELOPMENT) {
                console.log('popstate handled by the page.');
            }
            return;
        }
        load(getFullURL(), null);
        if (DEVELOPMENT) {
            console.log('popstate handled by the loader.');
        }
    });

    let loadingBarWidth: number = 33;
    let loadingBarShown: boolean = false;
    let pageLoaded: boolean = false;
    const loadingBar = getById('loading-bar');
    loadingBar.style.visibility = 'visible';
    loadingBar.style.opacity = '1';
    addTimeout(() => {
        if (pageLoaded) {
            loadingBar.style.visibility = 'hidden';
            loadingBar.style.opacity = '0';
        } else {
            loadingBar.style.width = loadingBarWidth + '%';
            loadingBarShown = true;
        }
    }, 300);

    scriptImportPromise.then((script) => {
        if (currentScriptImportPromise !== scriptImportPromise) {
            return;
        }
        currentPage = {
            script: script,
            html_entry: page.html_entry,
        };
        script.default(
            (callback?: () => void) => {
                Promise.all([htmlImportPromise, ...styleImportPromises]).then(([html]) => {
                    if (currentScriptImportPromise !== scriptImportPromise) {
                        return;
                    }

                    getBody().innerHTML = html.default;
                    callback?.();

                    pageLoaded = true;
                    if (loadingBarShown) {
                        loadingBar.style.width = '100%';
                        addTimeout(() => {
                            loadingBar.style.visibility = 'hidden';
                            loadingBar.style.opacity = '0';
                            addTimeout(() => {
                                loadingBar.style.width = '0';
                            }, 100);
                        }, 300);
                    }
                });
            },
            (url: string, withoutHistory: boolean = false) => {
                if (currentScriptImportPromise === scriptImportPromise) {
                    load(url, withoutHistory);
                }
            }
        );
        if (loadingBarShown) {
            loadingBar.style.width = '67%';
        } else {
            loadingBarWidth = 67;
        }
    });
}