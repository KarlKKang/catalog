import { addClass } from '../../class/add';
import * as styles from '../../../../../css/common.module.scss';
import { createAnchorElement } from '../anchor/create';
import { appendText } from '../text/append';

export function createEmailLink(email: string) {
    const elem = createAnchorElement();
    elem.style.wordBreak = 'break-all';
    addClass(elem, styles.link);
    elem.href = 'mailto:' + email;
    appendText(elem, email);
    return elem;
}
