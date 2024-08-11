import { addClass } from '../class';
import { container as autoContainerClass } from '../../../../css/multi_language/auto.module.scss';
import { container as manualContainerClass } from '../../../../css/multi_language/manual.module.scss';

export function addAutoMultiLanguageClass(elem: HTMLElement) {
    addClass(elem, autoContainerClass);
}

export function addManualMultiLanguageClass(elem: HTMLElement) {
    addClass(elem, manualContainerClass);
}
