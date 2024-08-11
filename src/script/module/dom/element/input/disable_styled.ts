import * as styles from '../../../../../css/common.module.scss';
import { addClass } from '../../class/add';
import { removeClass } from '../../class/remove';
import { StyledInputElementKey, type StyledInputElement } from './type';

export function disableStyledInput(inputElement: StyledInputElement, disabled: boolean) {
    inputElement[StyledInputElementKey.INPUT].disabled = disabled;
    if (disabled) {
        addClass(inputElement[StyledInputElementKey.CONTAINER], styles.disabled);
    } else {
        removeClass(inputElement[StyledInputElementKey.CONTAINER], styles.disabled);
    }
}