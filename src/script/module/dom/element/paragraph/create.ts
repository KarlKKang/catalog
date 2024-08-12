import { appendText } from '../text/append';
import { createElement } from '../internal/create_element';

export function createParagraphElement(text?: string) {
    const elem = createElement('p') as HTMLParagraphElement;
    text === undefined || appendText(elem, text);
    return elem;
}
