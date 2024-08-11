import { w } from '../dom/window';

export function getSessionStorage(key: string) {
    return w.sessionStorage.getItem(key);
}
