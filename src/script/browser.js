let dynamicImportTest = null; // eslint-disable-line @typescript-eslint/no-unused-vars, prefer-const

function unsupportRedirect() {
    const URL = '/unsupported_browser';
    window.location.replace(URL);
}

(function () {
    const w = window;
    const d = document;
    const _unsupportRedirect = unsupportRedirect;

    if (!('onerror' in w)) {
        _unsupportRedirect();
        return;
    }

    if (!w.addEventListener) {
        _unsupportRedirect();
        return;
    }

    if (!w.SyntaxError) {
        _unsupportRedirect();
        return;
    }

    w.addEventListener('error', (e) => {
        if (e.error instanceof SyntaxError) {
            _unsupportRedirect();
        }
    }, true);

    if (!w.Function || !Function.prototype.bind) {
        _unsupportRedirect();
        return;
    }

    if (!w.XMLHttpRequest || !('withCredentials' in new XMLHttpRequest())) {
        _unsupportRedirect();
        return;
    }

    if (!w.HTMLScriptElement) {
        _unsupportRedirect();
        return;
    }

    if (!('noModule' in HTMLScriptElement.prototype)) {
        _unsupportRedirect();
        return;
    }

    if (!w.CSS || !w.CSS.supports || !w.CSS.supports('(--a: 0)')) { // https://github.com/jhildenbiddle/css-vars-ponyfill/blob/master/src/index.js
        _unsupportRedirect();
        return;
    }

    if (!('IntersectionObserver' in w && 'IntersectionObserverEntry' in w && 'isIntersecting' in w.IntersectionObserverEntry.prototype)) {
        _unsupportRedirect();
        return;
    }

    const getCookie = (name) => {
        name = name + '=';
        const cookies = d.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return null;
    };

    const x = '__cookie_test__';
    d.cookie = x + '=' + x + ';max-age=10;path=/;secure;samesite=strict';
    if (getCookie(x) !== x) {
        _unsupportRedirect();
        return;
    }
    d.cookie = x + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;secure;samesite=strict';

    const storage = w.sessionStorage;
    if (!storage) {
        _unsupportRedirect();
        return;
    }
    try {
        storage.setItem(x, x);
    } catch (e) {
        // QuotaExceededError will be treated as unsupported browser. The storage should never reach the quota of a properly configured browser in normal operation.
        _unsupportRedirect();
        return;
    }
    if (storage.getItem(x) !== x) {
        _unsupportRedirect();
        return;
    }
    storage.removeItem(x);

    w.addEventListener('load', () => {
        const body = d.body;

        const dynamicImportScript = d.createElement('script');
        dynamicImportScript.textContent = 'dynamicImportTest=import("data:text/javascript;base64,Cg==")';
        body.appendChild(dynamicImportScript);

        const checkScript = d.createElement('script');
        checkScript.textContent = 'dynamicImportTest instanceof Promise?dynamicImportTest.catch(function(){unsupportRedirect()}):unsupportRedirect()';
        body.appendChild(checkScript);
    });
})();