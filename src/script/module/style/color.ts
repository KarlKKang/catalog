import { addClass } from '../dom/class/add';
import { removeClass } from '../dom/class/remove';
import * as styles from '../../../css/common.module.scss';

export const enum CSS_COLOR {
    RED,
    GREEN,
    ORANGE,
}

const colorMap: { [key in CSS_COLOR]: string } = {
    [CSS_COLOR.RED]: styles.colorRed,
    [CSS_COLOR.GREEN]: styles.colorGreen,
    [CSS_COLOR.ORANGE]: styles.colorOrange,
};

export function changeColor(elem: HTMLElement, color: CSS_COLOR | null) {
    for (const colorClass of Object.values(colorMap)) {
        removeClass(elem, colorClass);
    }
    if (color !== null) {
        addClass(elem, colorMap[color]);
    }
}
