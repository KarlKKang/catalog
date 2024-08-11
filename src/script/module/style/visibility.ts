import { addStyle, CSS_PROPERTY } from './internal';

export function setVisibility(element: HTMLElement, visible: boolean) {
    addStyle(element, CSS_PROPERTY.VISIBILITY, visible ? 'visible' : 'hidden');
}
