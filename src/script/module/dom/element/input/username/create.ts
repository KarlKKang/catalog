import { addAutoMultiLanguageClass } from '../../../../style/multi_language/auto';
import { StyledInputElementKey } from '../type';
import { createStyledInputElement } from '../styled/create';

export function createUsernameInput() {
    const styledInput = createStyledInputElement('text');
    const container = styledInput[StyledInputElementKey.CONTAINER];
    const input = styledInput[StyledInputElementKey.INPUT];
    addAutoMultiLanguageClass(container);
    input.autocomplete = 'username';
    input.placeholder = 'ユーザー名';
    input.autocapitalize = 'off';
    input.maxLength = 16;
    return styledInput;
}
