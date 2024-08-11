import { w } from '../document';

export function scrollToTop() {
    w.scrollBy(0, -1 * w.scrollY);
}
