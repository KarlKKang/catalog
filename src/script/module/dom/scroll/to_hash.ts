import { addTimeout } from '../../timer/add/timeout';
import { getHash } from '../location/get/hash';
import { w } from '../window';
import { getById } from '../element/get/by_id';

export function scrollToHash() {
    // Use this function only when the hash element is loaded after the DOM loads.
    const scrollID = getHash().slice(1);
    if (scrollID !== '') {
        const elem = getById(scrollID);
        if (elem !== null) {
            addTimeout(() => {
                w.scrollBy(0, elem.getBoundingClientRect().top);
            }, 500); // Give UI some time to load.
        }
    }
}
