import { d } from '..';
import { setOgTitle } from '../og/title/set';

let currentTitle = '';

export function getTitle() {
    return currentTitle;
}

export function setTitle(title: string) {
    currentTitle = title;
    const websiteName = ENV_WEBSITE_NAME;
    if (title === '') {
        setOgTitle(websiteName);
        d.title = websiteName;
    } else {
        setOgTitle(title);
        title += ' | ' + websiteName;
        d.title = title;
    }
}
