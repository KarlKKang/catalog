import { createElement } from '../../internal/create_element';
import { appendText } from '../../text/append';

export function createNativeButtonElement(text?: string) {
    const elem = createElement('button') as HTMLButtonElement;
    text === undefined || appendText(elem, text);
    return elem;
}
