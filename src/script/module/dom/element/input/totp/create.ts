import { StyledInputElementKey } from '../type';
import { createStyledInputElement } from '../styled/create';

export function createTotpInput(allowRecoveryCode: boolean) {
    const styledInput = createStyledInputElement('text');
    const input = styledInput[StyledInputElementKey.INPUT];
    input.autocomplete = 'one-time-code';
    input.placeholder = '認証コード';
    input.maxLength = allowRecoveryCode ? 32 : 6;
    return styledInput;
}
