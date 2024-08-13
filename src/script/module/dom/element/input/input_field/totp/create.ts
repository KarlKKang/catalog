import { InputFieldElementKey } from '../type';
import { createInputFieldElement } from '../create';

export function createTotpInputField(allowRecoveryCode: boolean) {
    const inputField = createInputFieldElement('text');
    const input = inputField[InputFieldElementKey.INPUT];
    input.autocomplete = 'one-time-code';
    input.placeholder = '認証コード';
    input.maxLength = allowRecoveryCode ? 32 : 6;
    return inputField;
}
