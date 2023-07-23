import {
    TOP_URL,
    LOGIN_URL
} from '../../../env/constant';
import { getBaseURL } from '../../../dom/document';

export function paramWithRedirect(message: string): { readonly message: string; readonly url?: typeof LOGIN_URL | typeof TOP_URL } {
    const href = getBaseURL();
    if (href == TOP_URL) {
        return {
            message: message,
            url: LOGIN_URL
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