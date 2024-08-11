import { windowLocation } from '../dom/location';
import { w } from '../dom/window';

export function setSessionStorage(key: string, value: string) {
    try {
        w.sessionStorage.setItem(key, value);
    } catch (e) {
        windowLocation.replace('/unsupported_browser');
        throw e;
    }
}
