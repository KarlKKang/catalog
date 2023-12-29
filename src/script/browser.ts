let dynamicImportTest: Promise<any> | null = null; // eslint-disable-line @typescript-eslint/no-unused-vars, prefer-const

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

    const getCookie = (name: string) => {
        name = name + '=';
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i] as string;
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return null;
    };

    try {
        const x = '__cookie_test__';
        document.cookie = x + '=' + x + ';max-age=10;path=/;domain=.<%=data.domain%>;secure;samesite=strict';
        if (getCookie(x) !== x) {
            unsupportRedirect();
            return;
        }
        document.cookie = x + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.<%=data.domain%>;secure;samesite=strict';
    } catch (e) {
        unsupportRedirect();
        return;
    }

    try {
        const storage = window.sessionStorage;
        if (!storage) {
            unsupportRedirect();
            return;
        }
        const x = '__storage_test__';
        storage.setItem(x, x);
        if (storage.getItem(x) !== x) {
            unsupportRedirect();
            return;
        }
        storage.removeItem(x);
    } catch (e) {
        // QuotaExceededError will be treated as unsupported browser. The storage should never reach the quota of a properly configured browser in normal operation.
        unsupportRedirect();
        return;
    }

    window.addEventListener('load', () => {
        const dynamicImportScript = document.createElement('script');
        dynamicImportScript.textContent = 'dynamicImportTest=import("data:text/javascript;base64,Cg==")';
        document.body.appendChild(dynamicImportScript);

        const checkScript = document.createElement('script');
        checkScript.textContent = 'dynamicImportTest instanceof Promise?dynamicImportTest.catch(function(){unsupportRedirect()}):unsupportRedirect()';
        document.body.appendChild(checkScript);
    });
})();