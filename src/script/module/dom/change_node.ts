import { getParentNode } from './get_element';

export function prependChild(parent: Node, child: Node) {
    parent.insertBefore(child, parent.firstChild); // Works with empty elements as well.
}

export function insertBefore(newNode: Node, beforeNode: Node) {
    getParentNode(beforeNode).insertBefore(newNode, beforeNode);
}

export function insertAfter(newNode: Node, afterNode: Node) {
    getParentNode(afterNode).insertBefore(newNode, afterNode.nextSibling);
}

export function remove(elem: Node) {
    getParentNode(elem).removeChild(elem);
}

export function replaceChildren(parent: Node, ...newChildren: Node[]) {
    let oldChild = parent.firstChild;
    while (oldChild !== null) {
        parent.removeChild(oldChild);
        oldChild = parent.firstChild;
    }
    appendChildren(parent, ...newChildren);
}

export function appendChild(parent: Node, child: Node) {
    parent.appendChild(child);
}

export function appendChildren(parent: Node, ...children: Node[]) {
    for (const child of children) {
        appendChild(parent, child);
    }
}
