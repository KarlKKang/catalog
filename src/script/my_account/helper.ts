import { changeColor, disableInput, passwordStyling } from '../module/common';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS, EMAIL_REGEX, PASSWORD_REGEX } from '../module/common/pure';
import { addClass, addEventListener, appendChild, appendChildren, appendText, createButtonElement, createDivElement, createInputElement, createParagraphElement, hideElement, removeClass, replaceChildren, replaceText, showElement } from '../module/dom';
import { pgid } from '../module/global';
import { accountDeactivated, loginFailed, mfaNotSet, sessionEnded, tooManyFailedLogin } from '../module/message/template/inline';
import { isString } from '../module/type/helper';
import { popupWindowImportPromise, promptForTotpImportPromise } from './import_promise';
import { SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS, SHARED_VAR_IDX_CURRENT_MFA_STATUS, SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON, SHARED_VAR_IDX_INVITE_BUTTON, SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT, SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON, SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO, SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING, SHARED_VAR_IDX_LOGOUT_BUTTON, SHARED_VAR_IDX_MFA_BUTTON, SHARED_VAR_IDX_MFA_INFO, SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT, SHARED_VAR_IDX_NEW_PASSWORD_INPUT, SHARED_VAR_IDX_NEW_USERNAME_INPUT, SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_BUTTON, SHARED_VAR_IDX_RECOVERY_CODE_INFO, SHARED_VAR_IDX_RECOVERY_CODE_WARNING, getSharedBool, getSharedButton, getSharedElement, getSharedInput } from './shared_var';

export function changeMfaStatus() {
    const disableButtonText = '無効にする';
    const loginNotificationEnabledPrefix = 'ログイン通知が有効になっています。';
    const mfaInfo = getSharedElement(SHARED_VAR_IDX_MFA_INFO);
    const mfaButton = getSharedButton(SHARED_VAR_IDX_MFA_BUTTON);
    const recoveryCodeInfo = getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_INFO);
    const recoveryCodeButton = getSharedButton(SHARED_VAR_IDX_RECOVERY_CODE_BUTTON);
    const loginNotificationInfo = getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO);
    const loginNotificationButton = getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON);
    if (getSharedBool(SHARED_VAR_IDX_CURRENT_MFA_STATUS)) {
        replaceText(mfaInfo, '二要素認証が有効になっています。');
        replaceText(mfaButton, disableButtonText);

        hideElement(recoveryCodeInfo);
        recoveryCodeButton.disabled = false;
        removeClass(recoveryCodeButton, 'not-allowed');

        const currentLoginNotificationStatus = getSharedBool(SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS);
        replaceText(loginNotificationInfo, currentLoginNotificationStatus ? loginNotificationEnabledPrefix : 'ログイン通知が無効になっています。');
        replaceText(loginNotificationButton, currentLoginNotificationStatus ? disableButtonText : '有効にする');
        loginNotificationButton.disabled = false;
        removeClass(loginNotificationButton, 'not-allowed');
    } else {
        replaceText(mfaInfo, mfaNotSet);
        replaceText(mfaButton, '設定する');

        replaceText(recoveryCodeInfo, 'リカバリーコードは、二要素認証が有効な場合にのみ生成できます。');
        changeColor(recoveryCodeInfo, null);
        showElement(recoveryCodeInfo);
        hideElement(getSharedElement(SHARED_VAR_IDX_RECOVERY_CODE_WARNING));
        recoveryCodeButton.disabled = true;
        addClass(recoveryCodeButton, 'not-allowed');

        replaceText(loginNotificationInfo, loginNotificationEnabledPrefix + 'ログイン通知を無効にできるのは、二要素認証が有効になっている場合のみです。');
        replaceText(loginNotificationButton, disableButtonText);
        hideElement(getSharedElement(SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING));
        loginNotificationButton.disabled = true;
        addClass(loginNotificationButton, 'not-allowed');
    }
}

export function disableAllInputs(disabled: boolean) {
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_USERNAME_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT), disabled);
    disableInput(getSharedInput(SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT), disabled);

    getSharedButton(SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_MFA_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_INVITE_BUTTON).disabled = disabled;
    getSharedButton(SHARED_VAR_IDX_LOGOUT_BUTTON).disabled = disabled;

    const currentMfaStatus = getSharedBool(SHARED_VAR_IDX_CURRENT_MFA_STATUS);
    getSharedButton(SHARED_VAR_IDX_RECOVERY_CODE_BUTTON).disabled = disabled || !currentMfaStatus;
    getSharedButton(SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON).disabled = disabled || !currentMfaStatus;
}

export function reauthenticationPrompt(
    sendRequestCallback: (
        authenticationParam: string,
        closeWindow: () => void,
        failedCallback: (message: string | Node[]) => void,
        failedTotpCallback: () => void,
    ) => void,
    warningElem: HTMLElement,
    directTotpPrompt = false,
    message?: string | Node[]
) {
    promptForLogin(
        (email, password, closeWindow, showWarning) => {
            const emailEncoded = encodeURIComponent(email);
            const passwordEncoded = encodeURIComponent(password);

            const failedTotpCallback = async () => {
                const currentPgid = pgid;
                const popupWindow = await popupWindowImportPromise;
                const promptForTotp = (await promptForTotpImportPromise).promptForTotp;
                if (currentPgid !== pgid) {
                    return;
                }

                promptForTotp(
                    popupWindow,
                    (totp, closeWindow, showWarning) => {
                        sendRequestCallback(
                            'email=' + emailEncoded + '&password=' + passwordEncoded + '&totp=' + totp,
                            closeWindow,
                            (message: string | Node[]) => { reauthenticationPrompt(sendRequestCallback, warningElem, directTotpPrompt, message); },
                            showWarning
                        );
                    },
                    () => { disableAllInputs(false); },
                    () => {
                        replaceText(warningElem, sessionEnded);
                        showElement(warningElem);
                    },
                );
            };

            if (directTotpPrompt) {
                failedTotpCallback();
            } else {
                sendRequestCallback(
                    'email=' + emailEncoded + '&password=' + passwordEncoded,
                    closeWindow,
                    showWarning,
                    failedTotpCallback
                );
            }
        },
        message
    );
}

export async function promptForLogin(
    submitCallback: (
        email: string,
        password: string,
        closeWindow: () => void,
        showWarning: (message: string | Node[]) => void,
    ) => void,
    message?: string | Node[]
) {
    const currentPgid = pgid;
    const popupWindowInitialize = await popupWindowImportPromise;
    if (currentPgid !== pgid) {
        return;
    }

    popupWindowInitialize().then((popupWindow) => {
        if (currentPgid !== pgid) {
            return;
        }

        const promptText = createParagraphElement();
        appendText(promptText, 'メールアドレスとパスワードを入力してください。');

        const warningText = createParagraphElement();
        if (message !== undefined) {
            if (isString(message)) {
                appendText(warningText, message as string);
            } else {
                appendChildren(warningText, ...message as Node[]);
            }
        } else {
            hideElement(warningText);
        }
        changeColor(warningText, 'red');

        const emailInputContainer = createDivElement();
        addClass(emailInputContainer, 'input-field');
        addClass(emailInputContainer, 'hcenter');
        const emailInput = createInputElement();
        emailInput.type = 'email';
        emailInput.autocomplete = 'email';
        emailInput.placeholder = 'メールアドレス';
        emailInput.autocapitalize = 'off';
        emailInput.maxLength = 254;
        appendChild(emailInputContainer, emailInput);

        const passwordInputContainer = createDivElement();
        addClass(passwordInputContainer, 'input-field');
        addClass(passwordInputContainer, 'hcenter');
        const passwordInput = createInputElement();
        passwordInput.type = 'password';
        passwordInput.autocomplete = 'current-password';
        passwordInput.placeholder = 'パスワード';
        passwordStyling(passwordInput);
        appendChild(passwordInputContainer, passwordInput);

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

        const disableAllPopUpWindowInputs = (disabled: boolean) => {
            disableInput(emailInput, disabled);
            disableInput(passwordInput, disabled);
            submitButton.disabled = disabled;
            cancelButton.disabled = disabled;

        };
        const submit = () => {
            disableAllPopUpWindowInputs(true);
            hideElement(warningText);

            const showWarning = (message: string | Node[]) => {
                if (isString(message)) {
                    replaceText(warningText, message as string);
                } else {
                    replaceChildren(warningText, ...message as Node[]);
                }
                showElement(warningText);
                disableAllPopUpWindowInputs(false);
            };

            const email = emailInput.value;
            const password = passwordInput.value;
            if (!EMAIL_REGEX.test(email) || !PASSWORD_REGEX.test(password)) {
                showWarning(loginFailed);
                return;
            }

            submitCallback(
                email,
                password,
                popupWindow.hide,
                showWarning
            );
        };
        const submitOnKeyDown = (event: Event) => {
            if ((event as KeyboardEvent).key === 'Enter') {
                submit();
            }
        };
        addEventListener(submitButton, 'click', submit);
        addEventListener(emailInput, 'keydown', submitOnKeyDown);
        addEventListener(passwordInput, 'keydown', submitOnKeyDown);
        addEventListener(cancelButton, 'click', () => {
            disableAllInputs(false);
            popupWindow.hide();
        });

        popupWindow.show(promptText, warningText, emailInputContainer, passwordInputContainer, buttonFlexbox);
        emailInput.focus();
    });
}

export function serverResponseCallback(response: string, failedCallback: (message: string | Node[]) => void, failedTotpCallback: () => void, successCallback: () => void) {
    switch (response) {
        case AUTH_FAILED:
            failedCallback(loginFailed);
            break;
        case AUTH_FAILED_TOTP:
            failedTotpCallback();
            break;
        case AUTH_DEACTIVATED:
            failedCallback([...accountDeactivated()]);
            break;
        case AUTH_TOO_MANY_REQUESTS:
            failedCallback(tooManyFailedLogin);
            break;
        default:
            successCallback();
    }
}