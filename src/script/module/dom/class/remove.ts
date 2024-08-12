import { getClassList } from './internal/get_class_list';

export function removeClass(elem: Element, className: string) {
    getClassList(elem).remove(className);
}
