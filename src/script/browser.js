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
    if (!cssSupports || !cssSupports('(--a:0)') || !cssSupports('margin:min(1em,1%)')) { // https://github.com/jhildenbiddle/css-vars-ponyfill/blob/master/src/index.js
        _unsupportRedirect();
        return;
    }

    if (!('IntersectionObserver' in w && 'IntersectionObserverEntry' in w && 'isIntersecting' in w.IntersectionObserverEntry.prototype)) {
        _unsupportRedirect();
        return;
    }

    const getCookie = (name) => {
        const part = ('; ' + d.cookie).split('; ' + name + '=')[1];
        if (part !== undefined) return part.split(';').shift();
        return undefined;
    };

    const x = '__cookie_test__';
    const cookieSuffix = ';path=/;secure;samesite=strict';
    for (let i = 0; i < 2; i++) { // We need to test at least 2 cookies to ensure that the cookies are separated by '; ' instead of just ';', which is the case in some broken browsers.
        d.cookie = x + i + '=' + x + i + ';max-age=10' + cookieSuffix;
    }
    for (let i = 0; i < 2; i++) {
        if (getCookie(x + i) !== x + i) {
            _unsupportRedirect();
            return;
        }
    }
    for (let i = 0; i < 2; i++) {
        d.cookie = x + i + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC' + cookieSuffix;
    }

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
