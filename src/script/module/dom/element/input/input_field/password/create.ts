import { addEventListener } from '../../../../../event_listener/add';
import { InputFieldElementKey } from '../type';
import { createInputFieldElement } from '../create';

export function createPasswordInputField(newPassword: boolean, placeholder = 'パスワード') {
    const inputField = createInputFieldElement('password');
    const input = inputField[InputFieldElementKey.INPUT];
    input.autocomplete = newPassword ? 'new-password' : 'current-password';
    input.placeholder = placeholder;
    passwordStyling(input);
    return inputField;
}

function passwordStyling(element: HTMLInputElement) {
    function inputChangeHandler() {
        const style = element.style;
        if (element.value === '') {
            style.fontFamily = '';
        } else {
            style.fontFamily = 'Helvetica, Arial';
        }
    }

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); // The object returned is mutable but mutating it has no effect on the original property's configuration.
    if (descriptor !== undefined && descriptor.configurable) { // 'undefined' in Chrome prior to Chrome 43 (https://developer.chrome.com/blog/DOM-attributes-now-on-the-prototype-chain/), not configurable in Safari 9.
        const originalSet = descriptor.set;
        if (originalSet !== undefined) {
            // define our own setter
            descriptor.set = function (...args) {
                originalSet.apply(this, args);
                inputChangeHandler();
            };
            Object.defineProperty(element, 'value', descriptor);
        }
    }

    addEventListener(element, 'input', inputChangeHandler);
    addEventListener(element, 'change', inputChangeHandler);
}
