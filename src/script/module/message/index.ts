import {
    TOP_URL,
} from '../env/constant';
import { getTitle, setSessionStorage, getFullURL } from '../dom/document';
import { defaultError } from '../text/title';
import { unknownError } from '../text/body';
import type { MessageParam } from './type';
import { redirect } from '../global';

export function show({ message, title, color, url, buttonText, logout, replaceBody }: MessageParam) {
    setSessionStorage('message', message ?? unknownError);
    setSessionStorage('title', title ?? defaultError);
    setSessionStorage('color', color ?? 'red');
    setSessionStorage('document-title', getTitle());

    if (buttonText !== null) {
        setSessionStorage('button-text', buttonText ?? '戻る');
        if (url === undefined) {
            setSessionStorage('url', getFullURL());
        } else {
            setSessionStorage('url', url);
        }
    }

    if (logout) {
        setSessionStorage('logout', '1');
    }
    if (replaceBody) {
        setSessionStorage('replace-body', '1');
    }

    redirect(TOP_URL + '/message', true);
}