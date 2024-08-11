import { setStyle, CSS_PROPERTY } from './internal';

export const enum CSS_CURSOR {
    NOT_ALLOWED = 'not-allowed',
}

export function setCursor(element: HTMLElement, cursor: CSS_CURSOR | null) {
    setStyle(element, CSS_PROPERTY.CURSOR, cursor);
}
