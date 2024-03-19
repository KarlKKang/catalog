import { addEventListener, addClass, appendChild, createButtonElement, createDivElement, createParagraphElement, createTotpInput, disableInput } from '../dom';
import { failedTotp } from '../text/message/body';
import { changeColor, hideElement, horizontalCenter, showElement } from '../style';
import { addInterval, removeInterval } from '../timer';
import type { initializePopupWindow as InitializePopupWindow } from './core';
import { cancelButtonText, submitButtonText } from '../text/ui';

export type TotpPopupWindow = [
    string, // totp
    () => Promise<TotpPopupWindow>, // show warning
    () => void, // close
];

const enum RejectReason {
    TIMEOUT,
    CLOSE,
}

export const TOTP_POPUP_WINDOW_TIMEOUT = RejectReason.TIMEOUT;

export function promptForTotp(initializePopupWindow: typeof InitializePopupWindow) {
    let returnPromiseResolve: (value: TotpPopupWindow) => void;
    let returnPromiseReject: (reason: unknown) => void;

    const returnPromise = new Promise<TotpPopupWindow>((resolve, reject) => {
        returnPromiseResolve = resolve;
        returnPromiseReject = reject;
    });

    const promptText = createParagraphElement('二要素認証コードまたはリカバリーコードを入力してください。');

    const warningText = createParagraphElement(failedTotp);
    changeColor(warningText, 'red');
    hideElement(warningText);

    const [totpInputContainer, totpInput] = createTotpInput(true);
    horizontalCenter(totpInputContainer);

    const submitButton = createButtonElement(submitButtonText);
    const cancelButton = createButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, 'input-flexbox');
    appendChild(buttonFlexbox, submitButton);
    appendChild(buttonFlexbox, cancelButton);

    const hidePopupWindow = initializePopupWindow(
        [promptText, warningText, totpInputContainer, buttonFlexbox],
        () => { totpInput.focus(); },
    );

    const startTime = Date.now();
    let timerBlocked = false;
    const timer = addInterval(() => {
        if (!timerBlocked && Date.now() - startTime > 90 * 1000) {
            returnPromiseReject(RejectReason.TIMEOUT);
            hidePopupWindow();
            removeInterval(timer);
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
        if (!/^\d{6}$/.test(totp) && !/^[a-zA-Z0-9~_-]{32}$/.test(totp)) {
            showElement(warningText);
            disableAllInputs(false);
            return;
        }

        timerBlocked = true;
        returnPromiseResolve([
            totp,
            () => {
                disableAllInputs(false);
                showElement(warningText);
                timerBlocked = false;
                return new Promise<TotpPopupWindow>((resolve, reject) => {
                    returnPromiseResolve = resolve;
                    returnPromiseReject = reject;
                });
            },
            () => {
                removeInterval(timer);
                hidePopupWindow();
            }
        ]);
    };
    addEventListener(submitButton, 'click', submit);
    addEventListener(totpInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submit();
        }
    });
    addEventListener(cancelButton, 'click', () => {
        returnPromiseReject(RejectReason.CLOSE);
        removeInterval(timer);
        hidePopupWindow();
    });

    return returnPromise;
}