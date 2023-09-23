import { addEventListener, addClass, appendChild, appendText, createButtonElement, createDivElement, createParagraphElement, getBody, removeClass, replaceChildren, w, createInputElement, hideElement, showElement } from './dom';
import { changeColor, disableInput } from './common';
import { failedTotp } from './message/template/inline';
import { addTimeout } from './timer';

type PopUpWindow = {
    show: (...contents: Node[]) => void;
    hide: () => void;
};

let instance: Promise<PopUpWindow> | null = null;

export function initializePopUpWindow() {
    if (instance !== null) {
        return instance;
    }

    const container = createDivElement();
    container.id = 'pop-up-window';
    const popUpWindow = createDivElement();
    const popUpWindowcontent = createDivElement();
    appendChild(container, popUpWindow);
    appendChild(popUpWindow, popUpWindowcontent);

    let currentTimeout: NodeJS.Timeout | null = null;

    const newInstance = new Promise<PopUpWindow>((resolve, reject) => {
        w.requestAnimationFrame(() => {
            if (newInstance !== instance) {
                reject();
            }
            addClass(container, 'invisible');
            addClass(container, 'transparent');
            appendChild(getBody(), container);
            w.requestAnimationFrame(() => {
                if (newInstance !== instance) {
                    reject();
                }
                resolve({
                    show: (...contents: Node[]) => {
                        currentTimeout = null;
                        replaceChildren(popUpWindowcontent, ...contents);
                        removeClass(container, 'invisible');
                        removeClass(container, 'transparent');
                    },
                    hide: () => {
                        addClass(container, 'transparent');
                        const timeout = addTimeout(() => {
                            if (currentTimeout === timeout) {
                                addClass(container, 'invisible');
                                replaceChildren(popUpWindowcontent);
                            }
                        }, 300);
                        currentTimeout = timeout;
                    }
                });
            });
        });
    });
    instance = newInstance;

    return instance;
}

export function promptForTotp(
    submitCallback: (
        totp: string,
        closeWindow: () => void,
        showWarning: () => void,
    ) => void,
    closeWindowCallback: () => void
) {
    initializePopUpWindow().then((popUpWindow) => {
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
                popUpWindow.hide,
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
            popUpWindow.hide();
        });

        popUpWindow.show(promptText, warningText, totpInputContainer, buttonFlexbox);
    }).catch();
}

export function destroy() {
    instance = null;
}