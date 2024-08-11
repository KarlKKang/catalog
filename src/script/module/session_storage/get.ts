import { w } from '../dom/document';

export function getSessionStorage(key: string) {
    return w.sessionStorage.getItem(key);
}
