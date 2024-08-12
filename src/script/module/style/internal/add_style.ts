import type { CSS_UNIT } from '../value/unit';
import type { CSS_PROPERTY } from './property';

export function addStyle(element: HTMLElement, property: CSS_PROPERTY, value: number | string, unit?: CSS_UNIT) {
    let valueStr = value.toString();
    if (unit !== undefined) {
        valueStr += unit;
    }
    element.style[property] = valueStr;
}
