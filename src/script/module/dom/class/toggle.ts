import { getClassList } from './internal/get_class_list';

export function toggleClass(elem: Element, className: string) {
    getClassList(elem).toggle(className);
}
