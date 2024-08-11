export function getParentNode(elem: Node) {
    const parent = elem.parentNode;
    if (parent === null) {
        throw new Error('Parent node not found.');
    }
    return parent;
}
