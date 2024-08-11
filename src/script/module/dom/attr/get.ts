export function getAttribute(elem: Element, name: string) {
    if (!elem.hasAttribute(name)) {
        return null;
    }
    return elem.getAttribute(name);
}
