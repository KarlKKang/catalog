import { getHash, w } from './document';
import { getByIdNative } from './get_element';
import { addTimeout } from '../timer';

export function scrollToTop() {
    w.scrollBy(0, -1 * w.scrollY);
}

export function scrollToHash() {
    // Use this function only when the hash element is loaded after the DOM loads.
    const scrollID = getHash();
    if (scrollID !== '') {
        const elem = getByIdNative(scrollID);
        if (elem !== null) {
            addTimeout(() => {
                w.scrollBy(0, elem.getBoundingClientRect().top);
            }, 500); // Give UI some time to load.
        }
    }
}
