export function setDataAttribute(elem: Element, name: string, value: string) {
    setAttribute(elem, 'data-' + name, value);
}

export function getDataAttribute(elem: Element, name: string) {
    return getAttribute(elem, 'data-' + name);
}

export function setAttribute(elem: Element, name: string, value: string) {
    elem.setAttribute(name, value);
}

export function getAttribute(elem: Element, name: string) {
    if (!elem.hasAttribute(name)) {
        return null;
    }
    return elem.getAttribute(name);
}
