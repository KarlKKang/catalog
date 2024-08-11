import type { CSS_UNIT } from './value/unit';

export const enum CSS_PROPERTY {
    WIDTH = 'width',
    HEIGHT = 'height',
    MAX_HEIGHT = 'maxHeight',
    MIN_HEIGHT = 'minHeight',
    OPACITY = 'opacity',
    PADDING_BOTTOM = 'paddingBottom',
    PADDING_TOP = 'paddingTop',
    LEFT = 'left',
    RIGHT = 'right',
    VISIBILITY = 'visibility',
    TRANSITION = 'transition',
    CURSOR = 'cursor',
    DISPLAY = 'display',
}
export function addStyle(element: HTMLElement, property: CSS_PROPERTY, value: number | string, unit?: CSS_UNIT) {
    let valueStr = value.toString();
    if (unit !== undefined) {
        valueStr += unit;
    }
    element.style[property] = valueStr;
}
export function removeStyle(element: HTMLElement, property: CSS_PROPERTY) {
    element.style[property] = '';
}
export function setStyle(element: HTMLElement, property: CSS_PROPERTY, value: number | string | null, unit?: CSS_UNIT) {
    if (value === null) {
        removeStyle(element, property);
    } else {
        addStyle(element, property, value, unit);
    }
}
