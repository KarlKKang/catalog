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

    if (!window.HTMLScriptElement || !HTMLScriptElement.prototype) {
        window.location.replace(URL);
        return;
    }

    /* ESM detection
    if (!('noModule' in HTMLScriptElement.prototype)) {
        window.location.replace(URL);
        return;
    }*/
})();