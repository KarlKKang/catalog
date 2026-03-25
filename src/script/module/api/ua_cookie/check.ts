import { d } from '../../dom/document';
import { uaCookieSuffix } from './internal/cookie_suffix';
import { uaCookieVal } from './internal/cookie_val';
import { setUACookie } from './set';

function getUACookieVal() {
    const part = ('; ' + d.cookie).split('; ua=')[1];
    if (part !== undefined) return part.split(';').shift();
    return undefined;
}

function deleteUACookie() {
    d.cookie = 'ua=;expires=Thu, 01 Jan 1970 00:00:00 UTC' + uaCookieSuffix;
}

export function checkUACookie() {
    const val = getUACookieVal();
    if (val === undefined) {
        return;
    }
    if (val !== uaCookieVal) {
        deleteUACookie();
        setUACookie();
    }
}
