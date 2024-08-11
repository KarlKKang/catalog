import { addTimeout } from '../../timer';
import { getHash } from '../location/get/hash';
import { w } from '../window';
import { getById } from '../get_element';

export function scrollToHash() {
    // Use this function only when the hash element is loaded after the DOM loads.
    const scrollID = getHash();
    if (scrollID !== '') {
        const elem = getById(scrollID);
        if (elem !== null) {
            addTimeout(() => {
                w.scrollBy(0, elem.getBoundingClientRect().top);
            }, 500); // Give UI some time to load.
        }
    }
}
