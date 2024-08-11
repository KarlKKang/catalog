import { addClass } from '../../dom/class';
import { container as autoContainerClass } from '../../../../css/multi_language/auto.module.scss';

export function addAutoMultiLanguageClass(elem: HTMLElement) {
    addClass(elem, autoContainerClass);
}
