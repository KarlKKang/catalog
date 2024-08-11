import { createButtonElement, createDivElement, createParagraphElement, createTotpInput } from '../dom/create_element';
import { disableButton, disableInput } from '../dom/change_input';
import { appendChild } from '../dom/change_node';
import { addClass } from '../dom/class';
import { addEventListener } from '../event_listener';
import { failedTotp } from '../text/message/body';
import { horizontalCenter } from '../style/horizontal_center';
import { showElement } from '../style/show_element';
import { hideElement } from '../style/hide_element';
import { changeColor, CSS_COLOR } from '../style/color';
import { addInterval, removeInterval } from '../timer';
import { cancelButtonText, submitButtonText } from '../text/ui';
import { initializePopupWindow, styles } from './core';
import { pgid } from '../global';

export const enum TotpPopupWindowKey {
    TOTP,
    SHOW_WARNING,
    CLOSE,
}
export interface TotpPopupWindow {
    [TotpPopupWindowKey.TOTP]: string;
    [TotpPopupWindowKey.SHOW_WARNING]: () => Promise<TotpPopupWindow>;
    [TotpPopupWindowKey.CLOSE]: () => void;
}

const enum RejectReason {
    TIMEOUT,
    CLOSE,
}

function promptForTotp() {
    let returnPromiseResolve: (value: TotpPopupWindow) => void;
    let returnPromiseReject: (reason: unknown) => void;

    const returnPromise = new Promise<TotpPopupWindow>((resolve, reject) => {
        returnPromiseResolve = resolve;
        returnPromiseReject = reject;
    });

    const promptText = createParagraphElement('二要素認証コードまたはリカバリーコードを入力してください。');

    const warningText = createParagraphElement(failedTotp);
    changeColor(warningText, CSS_COLOR.RED);
    hideElement(warningText);

    const [totpInputContainer, totpInput] = createTotpInput(true);
    horizontalCenter(totpInputContainer);

    const submitButton = createButtonElement(submitButtonText);
    const cancelButton = createButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, styles.inputFlexbox);
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
        disableButton(submitButton, disabled);
        disableButton(cancelButton, disabled);
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
        returnPromiseResolve({
            [TotpPopupWindowKey.TOTP]: totp,
            [TotpPopupWindowKey.SHOW_WARNING]: () => {
                disableAllInputs(false);
                showElement(warningText);
                timerBlocked = false;
                return new Promise<TotpPopupWindow>((resolve, reject) => {
                    returnPromiseResolve = resolve;
                    returnPromiseReject = reject;
                });
            },
            [TotpPopupWindowKey.CLOSE]: () => {
                removeInterval(timer);
                hidePopupWindow();
            },
        });
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

export async function handleFailedTotp(
    currentTotpPopupWindow: TotpPopupWindow | undefined,
    closeCallback: () => void,
    timeoutCallback: () => void,
    retryCallback: (totpPopupWindow: TotpPopupWindow) => void,
) {
    const currentPgid = pgid;
    let totpPopupWindowPromise: Promise<TotpPopupWindow>;
    if (currentTotpPopupWindow === undefined) {
        totpPopupWindowPromise = promptForTotp();
    } else {
        totpPopupWindowPromise = currentTotpPopupWindow[TotpPopupWindowKey.SHOW_WARNING]();
    }

    try {
        currentTotpPopupWindow = await totpPopupWindowPromise;
    } catch (e) {
        if (currentPgid !== pgid) {
            return;
        }
        if (e === RejectReason.TIMEOUT) {
            timeoutCallback();
        } else {
            closeCallback();
        }
        return;
    }
    if (currentPgid !== pgid) {
        return;
    }
    retryCallback(currentTotpPopupWindow);
}
