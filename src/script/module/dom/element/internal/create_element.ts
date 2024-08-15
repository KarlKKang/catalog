import { d } from '../../document';

export function createElement<T extends keyof HTMLElementTagNameMap>(tag: T) {
    const elem = d.createElement(tag);
    return elem;
}
