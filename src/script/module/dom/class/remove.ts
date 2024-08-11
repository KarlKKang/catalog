import { getClassList } from './internal';

export function removeClass(elem: Element, className: string) {
    getClassList(elem).remove(className);
}
