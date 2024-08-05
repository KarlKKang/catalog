import { addClass, removeClass } from '../dom/class';
import { type CSS_AUTO, type CSS_UNIT, type CSS_CURSOR, CSS_COLOR } from './value';
import * as styles from '../../../css/common.module.scss';

const enum CSS_PROPERTY {
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

export function setWidth(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setWidth(element: HTMLElement, value: typeof CSS_AUTO | null): void;
export function setWidth(element: HTMLElement, value: number | typeof CSS_AUTO | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.WIDTH, value, unit);
}

export function setHeight(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setHeight(element: HTMLElement, value: typeof CSS_AUTO | null): void;
export function setHeight(element: HTMLElement, value: number | typeof CSS_AUTO | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.HEIGHT, value, unit);
}

export function setMaxHeight(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setMaxHeight(element: HTMLElement, value: null): void;
export function setMaxHeight(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.MAX_HEIGHT, value, unit);
}

export function setMinHeight(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setMinHeight(element: HTMLElement, value: null): void;
export function setMinHeight(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.MIN_HEIGHT, value, unit);
}

export function setPaddingBottom(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setPaddingBottom(element: HTMLElement, value: null): void;
export function setPaddingBottom(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.PADDING_BOTTOM, value, unit);
}

export function setPaddingTop(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setPaddingTop(element: HTMLElement, value: null): void;
export function setPaddingTop(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.PADDING_TOP, value, unit);
}

export function setLeft(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setLeft(element: HTMLElement, value: null): void;
export function setLeft(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.LEFT, value, unit);
}

export function setRight(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setRight(element: HTMLElement, value: null): void;
export function setRight(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.RIGHT, value, unit);
}

export function setOpacity(element: HTMLElement, value: number) {
    addStyle(element, CSS_PROPERTY.OPACITY, value);
}

export function setVisibility(element: HTMLElement, visible: boolean) {
    addStyle(element, CSS_PROPERTY.VISIBILITY, visible ? 'visible' : 'hidden');
}

export function enableTransition(element: HTMLElement, enable: boolean) {
    if (enable) {
        removeStyle(element, CSS_PROPERTY.TRANSITION);
    } else {
        addStyle(element, CSS_PROPERTY.TRANSITION, 'none');
    }
}

export function setCursor(element: HTMLElement, cursor: CSS_CURSOR | null) {
    setStyle(element, CSS_PROPERTY.CURSOR, cursor);
}

function addStyle(element: HTMLElement, property: CSS_PROPERTY, value: number | string, unit?: CSS_UNIT) {
    let valueStr = value.toString();
    if (unit !== undefined) {
        valueStr += unit;
    }
    element.style[property] = valueStr;
}

function removeStyle(element: HTMLElement, property: CSS_PROPERTY) {
    element.style[property] = '';
}

function setStyle(element: HTMLElement, property: CSS_PROPERTY, value: number | string | null, unit?: CSS_UNIT) {
    if (value === null) {
        removeStyle(element, property);
    } else {
        addStyle(element, property, value, unit);
    }
}

export function hideElement(elem: HTMLElement) {
    addStyle(elem, CSS_PROPERTY.DISPLAY, 'none');
}

export function showElement(elem: HTMLElement) {
    removeStyle(elem, CSS_PROPERTY.DISPLAY);
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

export function horizontalCenter(elem: HTMLElement) {
    addClass(elem, styles.hcenter);
}
