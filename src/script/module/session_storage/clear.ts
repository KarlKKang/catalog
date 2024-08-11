import { w } from '../dom/window';

export function clearSessionStorage() {
    w.sessionStorage.clear();
}
