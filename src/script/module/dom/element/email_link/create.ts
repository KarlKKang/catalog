import { addClass } from '../../class/add';
import { link as linkClass } from '../../../../../css/link.module.scss';
import { createAnchorElement } from '../anchor/create';
import { appendText } from '../text/append';

export function createEmailLink(email: string) {
    const elem = createAnchorElement();
    elem.style.wordBreak = 'break-all';
    addClass(elem, linkClass);
    elem.href = 'mailto:' + email;
    appendText(elem, email);
    return elem;
}
