import { appendChild } from '../../node/append_child';
import { createTextNode } from './create';

export function appendText(parent: Node, content: string) {
    appendChild(parent, createTextNode(content));
}
