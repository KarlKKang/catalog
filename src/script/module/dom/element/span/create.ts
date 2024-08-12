import { appendText } from '../text/append';
import { createElement } from '../internal/create_element';

export function createSpanElement(text?: string) {
    const elem = createElement('span') as HTMLSpanElement;
    text === undefined || appendText(elem, text);
    return elem;
}
