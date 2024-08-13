import { InputFieldElementKey } from '../type';
import { createInputFieldElement } from '../create';

export function createEmailInputField(placeholder = 'メールアドレス') {
    const inputField = createInputFieldElement('email');
    const input = inputField[InputFieldElementKey.INPUT];
    input.autocomplete = 'email';
    input.placeholder = placeholder;
    input.autocapitalize = 'off';
    input.maxLength = 254;
    return inputField;
}
