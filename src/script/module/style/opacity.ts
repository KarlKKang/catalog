import { CSS_PROPERTY } from './internal/property';
import { addStyle } from './internal/add_style';

export function setOpacity(element: HTMLElement, value: number) {
    addStyle(element, CSS_PROPERTY.OPACITY, value);
}
