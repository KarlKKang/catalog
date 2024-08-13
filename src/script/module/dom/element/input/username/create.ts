import { addAutoMultiLanguageClass } from '../../../../style/multi_language/auto';
import { InputFieldElementKey } from '../type';
import { createInputFieldElement } from '../input_field/create';

export function createUsernameInputField() {
    const inputField = createInputFieldElement('text');
    const container = inputField[InputFieldElementKey.CONTAINER];
    const input = inputField[InputFieldElementKey.INPUT];
    addAutoMultiLanguageClass(container);
    input.autocomplete = 'username';
    input.placeholder = 'ユーザー名';
    input.autocapitalize = 'off';
    input.maxLength = 16;
    return inputField;
}
