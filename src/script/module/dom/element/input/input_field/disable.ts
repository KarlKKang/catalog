import { disabled as disabledClass } from '../../../../../css/input.module.scss';
import { addClass } from '../../../class/add';
import { removeClass } from '../../../class/remove';
import { InputFieldElementKey, type InputFieldElement } from './type';

export function disableInputField(inputElement: InputFieldElement, disabled: boolean) {
    inputElement[InputFieldElementKey.INPUT].disabled = disabled;
    if (disabled) {
        addClass(inputElement[InputFieldElementKey.CONTAINER], disabledClass);
    } else {
        removeClass(inputElement[InputFieldElementKey.CONTAINER], disabledClass);
    }
}
