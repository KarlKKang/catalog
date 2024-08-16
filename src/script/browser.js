let dynamicImportTest = null; // eslint-disable-line @typescript-eslint/no-unused-vars

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

    const windowAddEventListener = w.addEventListener;
    if (!windowAddEventListener) {
        _unsupportRedirect();
        return;
    }

    const _SyntaxError = w.SyntaxError;
    if (!_SyntaxError) {
        _unsupportRedirect();
        return;
    }

    windowAddEventListener('error', (e) => {
        if (e.error instanceof _SyntaxError) {
            _unsupportRedirect();
        }
    }, true);

    const _Function = w.Function;
    if (!_Function || !_Function.prototype.bind) {
        _unsupportRedirect();
        return;
    }

    const _XMLHttpRequest = w.XMLHttpRequest;
    if (!_XMLHttpRequest || !('withCredentials' in new _XMLHttpRequest())) {
        _unsupportRedirect();
        return;
    }

    const _HTMLScriptElement = w.HTMLScriptElement;
    if (!_HTMLScriptElement) {
        _unsupportRedirect();
        return;
    }

    if (!('noModule' in _HTMLScriptElement.prototype)) {
        _unsupportRedirect();
        return;
    }

    const cssSupports = w.CSS && w.CSS.supports;
    if (!cssSupports || !cssSupports('(--a: 0)')) { // https://github.com/jhildenbiddle/css-vars-ponyfill/blob/master/src/index.js
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
        for (let i = 0; i < cookies.length; i++) { // eslint-disable-line @typescript-eslint/prefer-for-of
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
    const cookieSuffix = ';path=/;secure;samesite=strict';
    d.cookie = x + '=' + x + ';max-age=10' + cookieSuffix;
    if (getCookie(x) !== x) {
        _unsupportRedirect();
        return;
    }
    d.cookie = x + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC' + cookieSuffix;

    const storage = w.sessionStorage;
    if (!storage) {
        _unsupportRedirect();
        return;
    }
    try {
        storage.setItem(x, x);
    } catch {
        // QuotaExceededError will be treated as unsupported browser. The storage should never reach the quota of a properly configured browser in normal operation.
        _unsupportRedirect();
        return;
    }
    if (storage.getItem(x) !== x) {
        _unsupportRedirect();
        return;
    }
    storage.removeItem(x);

    const appendScriptElement = (content) => {
        const script = d.createElement('script');
        script.textContent = content;
        d.body.appendChild(script);
    };
    windowAddEventListener('load', () => {
        appendScriptElement('dynamicImportTest=import("data:text/javascript;base64,Cg==")');
        appendScriptElement('dynamicImportTest instanceof Promise?dynamicImportTest.catch(function(){unsupportRedirect()}):unsupportRedirect()');
    });
})();
