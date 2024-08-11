import { replaceChildren } from '../../node/replace_children';
import { createTextNode } from './create';

export function replaceText(parent: Node, content: string) {
    replaceChildren(parent, createTextNode(content));
}
