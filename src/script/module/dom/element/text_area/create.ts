import { createElement } from '../internal/create_element';

export function createTextAreaElement(row?: number, column?: number) {
    const elem = createElement('textarea') as HTMLTextAreaElement;
    if (row !== undefined) {
        elem.rows = row;
    }
    if (column !== undefined) {
        elem.cols = column;
    }
    return elem;
}
