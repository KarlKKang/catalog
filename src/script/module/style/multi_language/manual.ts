import { addClass } from '../../dom/class/add';
import { container as manualContainerClass } from '../../../../css/multi_language/manual.module.scss';

export function addManualMultiLanguageClass(elem: HTMLElement) {
    addClass(elem, manualContainerClass);
}
