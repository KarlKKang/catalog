import { getParentNode } from './get_parent';

export function replaceWith(oldNode: Node, newNode: Node) {
    getParentNode(oldNode)?.replaceChild(newNode, oldNode);
}
