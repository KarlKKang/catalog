import { addClass } from '../../../class';
import * as styles from '../../../../../../css/common.module.scss';
import { createNativeButtonElement } from '../native/create';

export function createStyledButtonElement(text?: string) {
    const elem = createNativeButtonElement(text);
    addClass(elem, styles.button);
    return elem;
}
