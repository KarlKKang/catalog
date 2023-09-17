let dynamicImportPromise: Promise<any> | null = null; // eslint-disable-line @typescript-eslint/no-unused-vars, prefer-const

function unsupportRedirect() {
    const URL = 'https://<%=data.domain%>/unsupported_browser';
    const windowLocation = window.location;
    windowLocation.replace(URL);
}

(function () {
    if (!('onerror' in window)) {
        unsupportRedirect();
        return;
    }

    if (!window.addEventListener) {
        unsupportRedirect();
        return;
    }

    if (!window.SyntaxError) {
        unsupportRedirect();
        return;
    }

    window.addEventListener('error', (e) => {
        if (e.error instanceof SyntaxError) {
            unsupportRedirect();
        }
    }, true);

    if (!window.Function || !Function.prototype.bind) {
        unsupportRedirect();
        return;
    }

    if (!window.XMLHttpRequest || !('withCredentials' in new XMLHttpRequest())) {
        unsupportRedirect();
        return;
    }

    if (!window.HTMLScriptElement) {
        unsupportRedirect();
        return;
    }

    if (!('noModule' in HTMLScriptElement.prototype)) {
        unsupportRedirect();
        return;
    }

    if (!window.CSS || !window.CSS.supports || !window.CSS.supports('(--a: 0)')) { // https://github.com/jhildenbiddle/css-vars-ponyfill/blob/master/src/index.js
        unsupportRedirect();
        return;
    }

    window.addEventListener('load', () => {
        const dynamicImportScript = document.createElement('script');
        dynamicImportScript.textContent = 'dynamicImportPromise=import("data:text/javascript;base64,Cg==")';
        document.body.appendChild(dynamicImportScript);

        const checkScript = document.createElement('script');
        checkScript.textContent = 'dynamicImportPromise instanceof Promise?dynamicImportPromise.catch(function(){unsupportRedirect()}):unsupportRedirect()';
        document.body.appendChild(checkScript);
    });
})();