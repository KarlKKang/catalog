import { setHref } from '../dom/location/set/href';
import { w } from '../dom/window';

export function setSessionStorage(key: string, value: string) {
    try {
        w.sessionStorage.setItem(key, value);
    } catch (e) {
        setHref('/unsupported_browser', true);
        throw e;
    }
}
