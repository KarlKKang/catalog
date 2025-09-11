import { d } from '..';
import { WEBSITE_NAME } from '../../../env/website_name';
import { setOgTitle } from '../og/title/set';

let currentTitle = '';

export function getTitle() {
    return currentTitle;
}

export function setTitle(title: string) {
    currentTitle = title;
    const websiteName = WEBSITE_NAME;
    if (title === '') {
        setOgTitle(websiteName);
        d.title = websiteName;
    } else {
        setOgTitle(title);
        title += ' | ' + websiteName;
        d.title = title;
    }
}
