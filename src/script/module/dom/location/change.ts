import { STATE_TRACKER } from '../../global';

export function changeURL(url: string, withoutHistory?: boolean) {
    if (withoutHistory === true) {
        history.replaceState(STATE_TRACKER, '', url);
    } else {
        history.pushState(STATE_TRACKER, '', url);
    }
}
