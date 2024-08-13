import { addClass } from '../dom/class/add';
import { hcenter as hcenterClass } from '../../../css/hcenter.module.scss';

export function horizontalCenter(elem: HTMLElement) {
    addClass(elem, hcenterClass);
}
