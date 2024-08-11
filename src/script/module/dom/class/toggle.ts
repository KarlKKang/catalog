import { getClassList } from './internal';

export function toggleClass(elem: Element, className: string) {
    getClassList(elem).toggle(className);
}
