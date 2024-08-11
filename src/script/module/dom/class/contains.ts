import { getClassList } from './internal';

export function containsClass(elem: Element, className: string) {
    return getClassList(elem).contains(className);
}
