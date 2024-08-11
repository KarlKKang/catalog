import { getParentNode } from './get_parent';

export function insertBefore(newNode: Node, beforeNode: Node) {
    getParentNode(beforeNode)?.insertBefore(newNode, beforeNode);
}
