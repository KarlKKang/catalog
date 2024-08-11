export function prependChild(parent: Node, child: Node) {
    parent.insertBefore(child, parent.firstChild); // Works with empty elements as well.
}
