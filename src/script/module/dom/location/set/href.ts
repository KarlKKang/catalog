import { windowLocation } from '..';

export function setHref(href: string, withoutHistory?: boolean) {
    if (withoutHistory) {
        windowLocation.replace(href);
    } else {
        windowLocation.href = href;
    }
}
