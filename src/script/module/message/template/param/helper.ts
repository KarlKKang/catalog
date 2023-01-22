import {
    TOP_URL,
    LOGIN_URL
} from '../../../env/constant';
import { getBaseURL } from '../../../dom/document';

export function paramWithRedirect<T extends string>(message: T): { readonly message: T; readonly url?: typeof LOGIN_URL | typeof TOP_URL; readonly logout?: boolean } {
    const href = getBaseURL();
    if (href == TOP_URL) {
        return {
            message: message,
            url: LOGIN_URL,
            logout: true
        } as const;
    } else if (href == LOGIN_URL) {
        return {
            message: message
        } as const;
    } else {
        return {
            message: message,
            url: TOP_URL,
        } as const;
    }
}