import { StyledInputElementKey } from '../type';
import { createStyledInputElement } from '../styled/create';

export function createEmailInput(placeholder = 'メールアドレス') {
    const styledInput = createStyledInputElement('email');
    const input = styledInput[StyledInputElementKey.INPUT];
    input.autocomplete = 'email';
    input.placeholder = placeholder;
    input.autocapitalize = 'off';
    input.maxLength = 254;
    return styledInput;
}
