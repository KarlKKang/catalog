import { getParentNode } from './get_parent';

export function insertAfter(newNode: Node, afterNode: Node) {
    getParentNode(afterNode)?.insertBefore(newNode, afterNode.nextSibling);
}
