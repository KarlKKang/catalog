import { appendChild } from '../../node/append_child';
import { createLIElement } from './li/create';
import { appendText } from '../text/append';

export function appendListItems(list: HTMLUListElement | HTMLOListElement, ...contents: string[]): void {
    for (const content of contents) {
        const item = createLIElement();
        appendText(item, content);
        appendChild(list, item);
    }
}
