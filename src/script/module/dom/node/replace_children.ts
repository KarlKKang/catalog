import { appendChildren } from './append_children';

export function replaceChildren(parent: Node, ...newChildren: Node[]) {
    let oldChild = parent.firstChild;
    while (oldChild !== null) {
        parent.removeChild(oldChild);
        oldChild = parent.firstChild;
    }
    appendChildren(parent, ...newChildren);
}
