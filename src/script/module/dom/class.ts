export function addClass(elem: Element, className: string, ...classNames: string[]) {
    elem.classList.add(className);
    for (const className of classNames) {
        elem.classList.add(className);
    }
}

export function removeClass(elem: Element, className: string) {
    elem.classList.remove(className);
}

export function setClass(elem: Element, className: string) {
    elem.className = className;
}

export function toggleClass(elem: Element, className: string) {
    elem.classList.toggle(className);
}

export function containsClass(elem: Element, className: string) {
    return elem.classList.contains(className);
}
