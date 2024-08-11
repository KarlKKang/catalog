import { addStyle, CSS_PROPERTY } from './internal';

export function setOpacity(element: HTMLElement, value: number) {
    addStyle(element, CSS_PROPERTY.OPACITY, value);
}
