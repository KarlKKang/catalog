import { w } from '../window';

export function scrollToTop() {
    w.scrollBy(0, -1 * w.scrollY);
}
