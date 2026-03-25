import { addClass } from '../dom/class/add';
import { removeClass } from '../dom/class/remove';
import * as colorStyle from '../../../css/color.module.scss';
import { objectValues } from '../object';

export const enum CSS_COLOR {
    RED,
    GREEN,
    ORANGE,
}

const colorMap: Record<CSS_COLOR, string> = {
    [CSS_COLOR.RED]: colorStyle.red,
    [CSS_COLOR.GREEN]: colorStyle.green,
    [CSS_COLOR.ORANGE]: colorStyle.orange,
};

export function changeColor(elem: Element, color: CSS_COLOR | null) {
    for (const colorClass of objectValues(colorMap)) {
        removeClass(elem, colorClass);
    }
    if (color !== null) {
        addClass(elem, colorMap[color]);
    }
}
