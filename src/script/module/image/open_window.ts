import { getTitle } from '../dom/document/title/get';
import { openWindow } from '../dom/window/open';
import { setSessionStorage } from '../session_storage/set';
import { clearSessionStorage } from '../session_storage/clear';
import { IMAGE_URI } from '../env/uri';
import { ImageSessionTypes } from './session_type';

export function openImageWindow(baseURL: string, fileName: string, credential: string, sessionType: ImageSessionTypes) {
    setSessionStorage('base-url', baseURL);
    setSessionStorage('file-name', fileName);
    setSessionStorage('title', getTitle());
    setSessionStorage('session-credential', credential);
    setSessionStorage('session-type', sessionType);
    openWindow(IMAGE_URI);
    clearSessionStorage();
}
