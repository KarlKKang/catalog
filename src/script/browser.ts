(function () {
    const URL = 'https://featherine.com/unsupported_browser';

    if (!('onerror' in window)) {
        window.location.replace(URL);
        return;
    }

    if (!window.addEventListener) {
        window.location.replace(URL);
        return;
    }

    if (!window.SyntaxError) {
        window.location.replace(URL);
        return;
    }

    window.addEventListener('error', function (e) {
        if (e.error instanceof SyntaxError) {
            window.location.replace(URL);
        }
    }, true);

    if (!window.Function || !Function.prototype.bind) {
        window.location.replace(URL);
        return;
    }

    if (!window.XMLHttpRequest || !('withCredentials' in new XMLHttpRequest())) {
        window.location.replace(URL);
        return;
    }

    if (!window.HTMLScriptElement) {
        window.location.replace(URL);
        return;
    }

    if (!('noModule' in HTMLScriptElement.prototype)) {
        window.location.replace(URL);
        return;
    }

    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--a: 0)')) { // https://github.com/jhildenbiddle/css-vars-ponyfill/blob/master/src/index.js
        window.location.replace(URL);
        return;
    }
})();