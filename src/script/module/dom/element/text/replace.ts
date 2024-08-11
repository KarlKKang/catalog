import { replaceChildren } from '../../change_node';
import { createTextNode } from './create';

export function replaceText(parent: Node, content: string) {
    replaceChildren(parent, createTextNode(content));
}
