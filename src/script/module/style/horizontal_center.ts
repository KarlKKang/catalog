import { addClass } from '../dom/class/add';
import * as styles from '../../../css/common.module.scss';

export function horizontalCenter(elem: HTMLElement) {
    addClass(elem, styles.hcenter);
}
