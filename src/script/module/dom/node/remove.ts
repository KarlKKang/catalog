import { getParentNode } from './get_parent';

export function remove(elem: Node) {
    getParentNode(elem)?.removeChild(elem);
}
