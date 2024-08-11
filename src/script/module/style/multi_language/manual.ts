import { addClass } from '../../dom/class';
import { container as manualContainerClass } from '../../../../css/multi_language/manual.module.scss';

export function addManualMultiLanguageClass(elem: HTMLElement) {
    addClass(elem, manualContainerClass);
}
