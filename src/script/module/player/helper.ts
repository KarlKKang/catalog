import { addClass, containsClass, removeClass } from '../DOM';

export function addPlayerClass(elem: Element, className: string) {
    addClass(elem, 'player-' + className);
}

export function addPlayerClasses(elem: Element, classNames: string[]) {
    for (const className of classNames) {
        addClass(elem, 'player-' + className);
    }
}

export function removePlayerClass(elem: Element, className: string) {
    removeClass(elem, 'player-' + className);
}

export function containsPlayerClass(elem: Element, className: string) {
    return containsClass(elem, 'player-' + className);
}