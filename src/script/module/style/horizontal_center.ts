import { addClass } from '../dom/class';
import * as styles from '../../../css/common.module.scss';

export function horizontalCenter(elem: HTMLElement) {
    addClass(elem, styles.hcenter);
}
