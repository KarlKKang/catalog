import { appendChild } from '../../change_node';
import { createTextNode } from './create';

export function appendText(parent: Node, content: string) {
    appendChild(parent, createTextNode(content));
}
