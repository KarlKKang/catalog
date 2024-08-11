import { d } from '../document';

export function createElement(tag: string) {
    const elem = d.createElement(tag);
    return elem;
}
