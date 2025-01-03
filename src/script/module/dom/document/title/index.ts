import { d } from '..';
import { TOP_DOMAIN } from '../../../env/top_domain';
import { setOgTitle } from '../og/title/set';

let currentTitle = '';

export function getTitle() {
    return currentTitle;
}

export function setTitle(title: string) {
    currentTitle = title;
    const websiteName = DEVELOPMENT ? TOP_DOMAIN + ' (alpha)' : TOP_DOMAIN;
    if (title === '') {
        setOgTitle(websiteName);
        d.title = websiteName;
    } else {
        setOgTitle(title);
        title += ' | ' + websiteName;
        d.title = title;
    }
}
