import 'core-js';
import { getBaseURL, w, addEventListenerOnce, setTitle } from './module/dom';
import { LOGIN_URL, TOP_DOMAIN, TOP_URL } from './module/env/constant';
import { objectKeyExists } from './module/common/pure';
import type { HTMLImport } from './module/type/HTMLImport';

type PageEntry = (styleImportPromises: Promise<any>[], htmlImportPromises: HTMLImport) => void;
type PageScriptImport = Promise<{
    default: PageEntry;
}>;

type PageAsset = {
    script: () => PageScriptImport;
    style: () => Promise<any>[];
    html: () => HTMLImport;
    title?: string;
};

type PageMap = {
    [key: string]: PageAsset;
};

let windowLoaded = false;
function loadPage(scriptImportPromise: Promise<any>, styleImportPromises: Promise<any>[], htmlImportPromise: HTMLImport, title?: string) {
    const executeScript = () => {
        if (title !== undefined) {
            setTitle(title + ' | ' + TOP_DOMAIN + (DEVELOPMENT ? ' (alpha)' : ''));
        }
        scriptImportPromise.then((script) => {
            script.default(styleImportPromises, htmlImportPromise);
        });
    };

    if (windowLoaded) {
        executeScript();
    } else {
        addEventListenerOnce(w, 'load', () => {
            windowLoaded = true;
            executeScript();
        });
    }
}

(function () {
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
    const mainCss = () => import('../css/main.scss');
    const popUpWindowCss = () => import('../css/pop_up_window.scss');
    const portalFormCss = () => import('../css/portal_form.scss');
    const newsCss = () => import('../css/news.scss');
    const registerCss = () => import('../css/register.scss');
    const messageCss = () => import('../css/message.scss');

    const messagePage = {
        script: () => import('./message'),
        style: () => [
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            mainCss(),
            messageCss(),
        ],
        html: () => import('../html/message.html'),
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
                mainCss(),
                import('../css/index.scss'),
            ],
            html: () => import('../html/index.html'),
        },
        'confirm_new_email': {
            script: () => import('./confirm_new_email'),
            style: () => [
                notoSansJPLightCss(),
                notoSansJPMediumCss(),
                mainCss(),
                portalFormCss(),
            ],
            html: () => import('../html/confirm_new_email.html'),
            title: 'メールアドレス変更',
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
        },
        'image': {
            script: () => import('./image'),
            style: () => [
                import('../css/image.scss'),
            ],
            html: () => import('../html/image.html'),
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
                mainCss(),
                newsCss(),
            ],
            html: () => import('../html/info.html'),
            title: 'ご利用ガイド',
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
                popUpWindowCss(),
                mainCss(),
                import('../css/my_account.scss'),
            ],
            html: () => import('../html/my_account.html'),
            title: 'マイページ',
        },
        'new_email': {
            script: () => import('./new_email'),
            style: () => [
                notoSansJPLightCss(),
                notoSansJPMediumCss(),
                mainCss(),
                portalFormCss(),
            ],
            html: () => import('../html/new_email.html'),
            title: 'メールアドレス変更',
        },
        'register': {
            script: () => import('./register'),
            style: () => [
                notoSansJPLightCss(),
                notoSansJPMediumCss(),
                notoSansLightCss(),
                notoSansTCLightCss(),
                notoSansSCLightCss(),
                mainCss(),
                portalFormCss(),
                registerCss(),
            ],
            html: () => import('../html/register.html'),
            title: '新規登録',
        },
        'special_register': {
            script: () => import('./special_register'),
            style: () => [
                notoSansJPLightCss(),
                notoSansJPMediumCss(),
                mainCss(),
                portalFormCss(),
                registerCss(),
            ],
            html: () => import('../html/special_register.html'),
            title: '新規登録',
        },
    };
    const directories: PageMap = {
        'bangumi': {
            script: () => import('./bangumi'),
            style: () => [
                notoSansJPLightCss(),
                notoSansJPMediumCss(),
                segMDL2Css(),
                mainCss(),
                import('../css/bangumi.scss'),
                import('../css/player.scss'),
            ],
            html: () => import('../html/bangumi.html'),
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
                mainCss(),
                newsCss(),
            ],
            html: () => import('../html/news.html'),
            title: 'お知らせ',
        },
    };
    const loginPages: PageMap = {
        '': {
            script: () => import('./login'),
            style: () => [
                notoSansJPLightCss(),
                notoSansJPMediumCss(),
                mainCss(),
                portalFormCss(),
                popUpWindowCss(),
                import('../css/login.scss'),
            ],
            html: () => import('../html/login.html'),
            title: 'ログイン',
        },
        'message': messagePage,
        'request_password_reset': {
            script: () => import('./request_password_reset'),
            style: () => [
                notoSansJPLightCss(),
                notoSansJPMediumCss(),
                mainCss(),
                portalFormCss(),
            ],
            html: () => import('../html/request_password_reset.html'),
            title: 'パスワード再発行',
        },
        'password_reset': {
            script: () => import('./password_reset'),
            style: () => [
                notoSansJPLightCss(),
                notoSansJPMediumCss(),
                mainCss(),
                portalFormCss(),
            ],
            html: () => import('../html/password_reset.html'),
            title: 'パスワード再発行',
        },
    };

    let baseURL = getBaseURL();

    if (baseURL === TOP_URL || baseURL === LOGIN_URL) {
        baseURL += '/';
    }

    if (baseURL.startsWith(TOP_URL + '/')) {
        let page = baseURL.substring(TOP_URL.length + 1);
        if (objectKeyExists(page, pages)) {
            const pageAsset = pages[page];
            loadPage(pageAsset!.script(), pageAsset!.style(), pageAsset!.html(), pageAsset!.title);
            return;
        }
        page = page.substring(0, page.indexOf('/'));
        if (objectKeyExists(page, directories)) {
            const pageAsset = directories[page];
            loadPage(pageAsset!.script(), pageAsset!.style(), pageAsset!.html(), pageAsset!.title);
            return;
        }
    }

    if (baseURL.startsWith(LOGIN_URL + '/')) {
        const page = baseURL.substring(LOGIN_URL.length + 1);
        if (objectKeyExists(page, loginPages)) {
            const pageAsset = loginPages[page];
            loadPage(pageAsset!.script(), pageAsset!.style(), pageAsset!.html(), pageAsset!.title);
            return;
        }
    }

    loadPage(
        import('./404'),
        [
            notoSansJPLightCss(),
            notoSansJPMediumCss(),
            mainCss(),
            messageCss(),
            import('../css/404.scss'),
        ],
        import('../html/404.html'),
        '404'
    );
})();