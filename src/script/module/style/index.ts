import type { CSS_AUTO, CSS_UNIT, CSS_CURSOR } from './value';

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
    setStyle(element, CSS_PROPERTY.OPACITY, value);
}

export function setVisibility(element: HTMLElement, visible: boolean) {
    setStyle(element, CSS_PROPERTY.VISIBILITY, visible ? 'visible' : 'hidden');
}

export function enableTransition(element: HTMLElement, enable: boolean) {
    if (enable) {
        removeStyle(element, CSS_PROPERTY.TRANSITION);
    } else {
        setStyle(element, CSS_PROPERTY.TRANSITION, 'none');
    }
}

export function setCursor(element: HTMLElement, cursor: CSS_CURSOR | null) {
    setStyle(element, CSS_PROPERTY.CURSOR, cursor);
}

function removeStyle(element: HTMLElement, property: CSS_PROPERTY) {
    element.style[property] = '';
}

function setStyle(element: HTMLElement, property: CSS_PROPERTY, value: number | string | null, unit?: CSS_UNIT) {
    if (value === null) {
        removeStyle(element, property);
    } else {
        let valueStr = value.toString();
        if (unit !== undefined) {
            valueStr += unit;
        }
        element.style[property] = valueStr;
    }
}