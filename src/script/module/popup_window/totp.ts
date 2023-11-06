import { addEventListener, addClass, appendChild, appendText, createButtonElement, createDivElement, createParagraphElement, createInputElement, hideElement, showElement } from '../dom';
import { changeColor, disableInput } from '../common';
import { failedTotp } from '../message/template/inline';
import { addInterval, removeInterval } from '../timer';
import type { PopupWindow } from './core';

export function promptForTotp(
    initializePopupWindow: () => Promise<PopupWindow>,
    submitCallback: (
        totp: string,
        closeWindow: () => void,
        showWarning: () => void,
    ) => void,
    closeWindowCallback: () => void,
    timeoutCallback: () => void,
) {
    initializePopupWindow().then((popupWindow) => {
        const promptText = createParagraphElement();
        appendText(promptText, '二要素認証コードまたはリカバリーコードを入力してください。');

        const warningText = createParagraphElement();
        appendText(warningText, failedTotp);
        changeColor(warningText, 'red');
        hideElement(warningText);

        const totpInputContainer = createDivElement();
        addClass(totpInputContainer, 'input-field');
        addClass(totpInputContainer, 'hcenter');
        const totpInput = createInputElement();
        totpInput.type = 'text';
        totpInput.autocomplete = 'one-time-code';
        totpInput.placeholder = '認証コード';
        totpInput.maxLength = 32;
        appendChild(totpInputContainer, totpInput);

        const submitButton = createButtonElement();
        addClass(submitButton, 'button');
        appendText(submitButton, '送信する');
        const cancelButton = createButtonElement();
        addClass(cancelButton, 'button');
        appendText(cancelButton, 'キャンセル');
        const buttonFlexbox = createDivElement();
        addClass(buttonFlexbox, 'input-flexbox');
        appendChild(buttonFlexbox, submitButton);
        appendChild(buttonFlexbox, cancelButton);

        const startTime = Date.now();
        const timer = addInterval(() => {
            if (Date.now() - startTime > 90 * 1000) {
                closeWindowCallback();
                timeoutCallback();
                popupWindow.hide();
            }
        }, 1000);

        const disableAllInputs = (disabled: boolean) => {
            disableInput(totpInput, disabled);
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;

        };
        const submit = () => {
            disableAllInputs(true);
            hideElement(warningText);

            const totp = totpInput.value;
            if (!/^\d{6}$/.test(totp) && !/^[A-Za-z\d/+=]{32}$/.test(totp)) {
                showElement(warningText);
                return;
            }

            submitCallback(
                totp,
                () => {
                    removeInterval(timer);
                    popupWindow.hide();
                },
                () => {
                    disableAllInputs(false);
                    showElement(warningText);
                }
            );
        };
        addEventListener(submitButton, 'click', submit);
        addEventListener(totpInput, 'keydown', (event) => {
            if ((event as KeyboardEvent).key === 'Enter') {
                submit();
            }
        });
        addEventListener(cancelButton, 'click', () => {
            closeWindowCallback();
            removeInterval(timer);
            popupWindow.hide();
        });

        popupWindow.show(promptText, warningText, totpInputContainer, buttonFlexbox);
        totpInput.focus();
    });
}