import { w } from '.';
import { redirectSameOrigin } from '../../global/redirect';
import { addTimeout } from '../../timer/add/timeout';

export function closeWindow(fallbackURL: string) {
    w.close();
    // Javascript cannot close a window that it did not open.
    addTimeout(() => {
        redirectSameOrigin(fallbackURL);
    });
};
