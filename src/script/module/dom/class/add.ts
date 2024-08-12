import { getClassList } from './internal/get_class_list';

export function addClass(elem: Element, className: string, ...classNames: string[]) {
    const classList = getClassList(elem);
    classList.add(className);
    for (const className of classNames) {
        classList.add(className);
    }
}
