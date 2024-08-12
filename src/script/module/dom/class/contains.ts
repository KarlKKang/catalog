import { getClassList } from './internal/get_class_list';

export function containsClass(elem: Element, className: string) {
    return getClassList(elem).contains(className);
}
