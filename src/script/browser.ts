(function () {
    const URL = '/unsupported_browser';
    const windowLocation = window.location;

    if (!('onerror' in window)) {
        windowLocation.replace(URL);
        return;
    }

    if (!window.addEventListener) {
        windowLocation.replace(URL);
        return;
    }

    if (!window.SyntaxError) {
        windowLocation.replace(URL);
        return;
    }

    window.addEventListener('error', function (e) {
        if (e.error instanceof SyntaxError) {
            windowLocation.replace(URL);
        }
    }, true);

    if (!window.Function || !Function.prototype.bind) {
        windowLocation.replace(URL);
        return;
    }

    if (!window.XMLHttpRequest || !('withCredentials' in new XMLHttpRequest())) {
        windowLocation.replace(URL);
        return;
    }

    if (!window.HTMLScriptElement) {
        windowLocation.replace(URL);
        return;
    }

    if (!('noModule' in HTMLScriptElement.prototype)) {
        windowLocation.replace(URL);
        return;
    }

    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--a: 0)')) { // https://github.com/jhildenbiddle/css-vars-ponyfill/blob/master/src/index.js
        windowLocation.replace(URL);
        return;
    }
})();