import { addEventListener } from '../../../../event_listener/add';
import { StyledInputElementKey } from '../type';
import { createStyledInputElement } from '../styled/create';

export function createPasswordInput(newPassword: boolean, placeholder = 'パスワード') {
    const styledInput = createStyledInputElement('password');
    const input = styledInput[StyledInputElementKey.INPUT];
    input.autocomplete = newPassword ? 'new-password' : 'current-password';
    input.placeholder = placeholder;
    passwordStyling(input);
    return styledInput;
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
