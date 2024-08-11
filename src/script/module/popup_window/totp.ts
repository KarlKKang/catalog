import { createStyledButtonElement } from '../dom/element/button/styled/create';
import { createTotpInput } from '../dom/element/input/totp/create';
import { createParagraphElement } from '../dom/element/paragraph/create';
import { createDivElement } from '../dom/element/div/create';
import { disableStyledInput } from '../dom/element/input/disable_styled';
import { disableButton } from '../dom/element/button/disable';
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
import { StyledInputElementKey } from '../dom/element/input/type';

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

    const totpStyledInput = createTotpInput(true);
    const {
        [StyledInputElementKey.CONTAINER]: totpInputContainer,
        [StyledInputElementKey.INPUT]: totpInput,
    } = totpStyledInput;
    horizontalCenter(totpInputContainer);

    const submitButton = createStyledButtonElement(submitButtonText);
    const cancelButton = createStyledButtonElement(cancelButtonText);
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
        disableStyledInput(totpStyledInput, disabled);
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
