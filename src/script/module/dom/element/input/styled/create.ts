import { appendChild } from '../../../node/append_child';
import { addClass } from '../../../class/add';
import { inputField as inputFieldClass } from '../../../../../../css/input.module.scss';
import { createDivElement } from '../../div/create';
import { createInputElement } from '../native/create';
import { StyledInputElementKey, type StyledInputElement } from '../type';

export function createStyledInputElement(type: string): StyledInputElement {
    const container = createDivElement();
    addClass(container, inputFieldClass);
    const input = createInputElement(type);
    appendChild(container, input);
    return {
        [StyledInputElementKey.CONTAINER]: container,
        [StyledInputElementKey.INPUT]: input,
    };
}