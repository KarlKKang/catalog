import { CSS_PROPERTY } from './internal/property';
import { addStyle } from './internal/add_style';

export function setVisibility(element: HTMLElement, visible: boolean) {
    addStyle(element, CSS_PROPERTY.VISIBILITY, visible ? 'visible' : 'hidden');
}
