import { d } from '..';
import { setOgTitle } from '../og/title/set';

export function setTitle(title: string) {
    d.title = title;
    setOgTitle(title);
}
