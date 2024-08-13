import { appendChild } from '../../../node/append_child';
import { addClass } from '../../../class/add';
import { inputField as inputFieldClass } from '../../../../../../css/input.module.scss';
import { createDivElement } from '../../div/create';
import { createInputElement } from '../native/create';
import { InputFieldElementKey, type InputFieldElement } from '../type';

export function createInputFieldElement(type: string): InputFieldElement {
    const container = createDivElement();
    addClass(container, inputFieldClass);
    const input = createInputElement(type);
    appendChild(container, input);
    return {
        [InputFieldElementKey.CONTAINER]: container,
        [InputFieldElementKey.INPUT]: input,
    };
}
