import { d } from '../../dom/document';
import { importModule } from '../../import_module';
import { uaCookieSuffix } from './internal/cookie_suffix';
import { setUACookieVal, uaCookieVal } from './internal/cookie_val';

function setDocumentCookie(val: string) {
    d.cookie = 'ua=' + val + uaCookieSuffix;
}

export async function setUACookie() {
    if (uaCookieVal !== null) {
        setDocumentCookie(uaCookieVal);
        return;
    }
    const cookieVal = (await importModule(
        () => import(
            /* webpackExports: ["default"] */
            './internal/get_cookie_val',
        ),
    )).default();
    setUACookieVal(cookieVal);
    setDocumentCookie(cookieVal);
}
