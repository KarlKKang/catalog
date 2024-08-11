import { appendChild } from './append_child';

export function appendChildren(parent: Node, ...children: Node[]) {
    for (const child of children) {
        appendChild(parent, child);
    }
}
