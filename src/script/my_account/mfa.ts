import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { parseResponse } from '../module/server/parse_response';
import { addEventListener } from '../module/event_listener/add';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createTotpInputField } from '../module/dom/element/input/input_field/totp/create';
import { replaceText } from '../module/dom/element/text/replace';
import { appendText } from '../module/dom/element/text/append';
import { createAnchorElement } from '../module/dom/element/anchor/create';
import { createCanvasElement } from '../module/dom/element/canvas/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableInputField } from '../module/dom/element/input/input_field/disable';
import { disableButton } from '../module/dom/element/button/disable';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/message/param/invalid_response';
import {
    sessionEnded,
} from '../module/text/misc/session_ended';
import { accountDeactivated } from '../module/text/auth/deactivated';
import { failedTotp } from '../module/text/auth/failed_totp';
import { tooManyFailedLogin } from '../module/text/auth/too_many_failed';
import { loginFailed } from '../module/text/auth/failed';
import { type TOTPInfo, TOTPInfoKey, parseTotpInfo } from '../module/type/TOTPInfo';
import { toCanvas } from 'qrcode';
import { removeInterval } from '../module/timer/remove/interval';
import { addInterval } from '../module/timer/add/interval';
import { pgid } from '../module/global/pgid';
import { SharedBool, SharedButton, SharedElement, getSharedBool, getSharedButton, getSharedElement } from './shared_var';
import { updateMfaUI, disableAllInputs, mfaNotSet } from './helper';
import { handleFailedLogin, reauthenticationPrompt } from './auth_helper';
import { promptForEmailOtp, type EmailOtpPopupWindow, EmailOtpPopupWindowKey } from './email_otp_popup_window';
import { LoginPopupWindowKey, type LoginPopupWindow } from './login_popup_window';
import { AUTH_TOO_MANY_REQUESTS } from '../module/auth_result/too_many_requests';
import { AUTH_DEACTIVATED } from '../module/auth_result/deactivated';
import { AUTH_FAILED_TOTP } from '../module/auth_result/failed_totp';
import { AUTH_FAILED } from '../module/auth_result/failed';
import { joinHttpForms } from '../module/string/http_form/join';
import { buildHttpForm } from '../module/string/http_form/build';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { setCursor, CSS_CURSOR } from '../module/style/cursor';
import { setHeight } from '../module/style/height';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { closeButtonText } from '../module/text/button/close';
import { cancelButtonText } from '../module/text/button/cancel';
import { submitButtonText } from '../module/text/button/submit';
import { link as linkClass } from '../../css/link.module.scss';
import * as styles from '../../css/my_account.module.scss';
import { type RecoveryCodeInfo, parseRecoveryCodeInfo } from '../module/type/RecoveryCodeInfo';
import { initializePopupWindow, styles as popupWindowStyles } from '../module/popup_window/core';
import { InputFieldElementKey } from '../module/dom/element/input/input_field/type';
import { removeAllEventListeners } from '../module/event_listener/remove/all_listeners';
import type { Interval } from '../module/timer/type';

const mfaAlreadySet = '二要素認証はすでに有効になっています。';

export default function () {
    addEventListener(getSharedButton(SharedButton.mfaButton), 'click', () => {
        if (getSharedBool(SharedBool.currentMfaStatus)) {
            disableMfa();
        } else {
            enableMfa();
        }
    });
    addEventListener(getSharedButton(SharedButton.recoveryCodeButton), 'click', () => {
        generateRecoveryCode();
    });
}

function enableMfa() {
    disableAllInputs(true);
    const mfaWarning = getSharedElement(SharedElement.mfaWarning);

    hideElement(mfaWarning);
    changeColor(mfaWarning, CSS_COLOR.RED);

    modifyMfaReauthenticationPrompt(
        'generate_totp',
        (response: string) => {
            if (response === AUTH_FAILED_TOTP) {
                updateMfaUI(true);
                changeColor(mfaWarning, CSS_COLOR.GREEN);
                replaceText(mfaWarning, mfaAlreadySet);
                showElement(mfaWarning);
                disableAllInputs(false);
                return true;
            }
            promptForTotpSetup(parseResponse(response, parseTotpInfo));
            return false;
        },
        mfaWarning,
    );
}

function disableMfa() {
    disableAllInputs(true);
    const mfaWarning = getSharedElement(SharedElement.mfaWarning);

    hideElement(mfaWarning);
    changeColor(mfaWarning, CSS_COLOR.RED);

    modifyMfaReauthenticationPrompt(
        'disable_totp',
        (response: string) => {
            if (response === 'DONE') {
                updateMfaUI(false);
                changeColor(mfaWarning, CSS_COLOR.GREEN);
                replaceText(mfaWarning, '二要素認証が無効になりました。');
                showElement(mfaWarning);
            } else {
                showMessage(invalidResponse());
                return false;
            }
            disableAllInputs(false);
            return true;
        },
        mfaWarning,
    );
}

function generateRecoveryCode() {
    disableAllInputs(true);
    const recoveryCodeWarning = getSharedElement(SharedElement.recoveryCodeWarning);

    hideElement(recoveryCodeWarning);
    changeColor(recoveryCodeWarning, CSS_COLOR.RED);

    reauthenticationPrompt(
        'generate_recovery_code',
        (response: string) => {
            if (response === 'TOTP NOT SET') {
                updateMfaUI(false);
                replaceText(recoveryCodeWarning, mfaNotSet);
                showElement(recoveryCodeWarning);
                disableAllInputs(false);
            } else if (response === 'WAIT') {
                replaceText(recoveryCodeWarning, '直前にリカバリーコードを生成したため、1時間ほど待ってから再度生成を試みてください。');
                showElement(recoveryCodeWarning);
                disableAllInputs(false);
            } else {
                showRecoveryCode(parseResponse(response, parseRecoveryCodeInfo), () => {
                    hideElement(getSharedElement(SharedElement.recoveryCodeInfo));
                    disableAllInputs(false);
                });
                return false;
            }
            return true;
        },
        recoveryCodeWarning,
        undefined,
        true,
    );
}

function modifyMfaReauthenticationPrompt(
    uri: string,
    callback: (response: string) => boolean,
    warningElem: HTMLElement,
    content?: string,
    loginPopupWindow?: LoginPopupWindow,
    emailOtpPopupWindow?: EmailOtpPopupWindow,
) {
    if (loginPopupWindow === undefined) {
        handleFailedLogin(
            undefined,
            () => {
                disableAllInputs(false);
            },
            (loginPopupWindow) => {
                modifyMfaReauthenticationPrompt(uri, callback, warningElem, content, loginPopupWindow);
            },
        );
        return;
    }
    sendServerRequest(uri, {
        [ServerRequestOptionKey.CALLBACK]: (response: string) => {
            const closeAll = () => {
                emailOtpPopupWindow?.[EmailOtpPopupWindowKey.CLOSE]();
                loginPopupWindow[LoginPopupWindowKey.CLOSE]();
            };
            switch (response) {
                case AUTH_DEACTIVATED:
                    replaceChildren(warningElem, ...accountDeactivated());
                    closeAll();
                    showElement(warningElem);
                    disableAllInputs(false);
                    break;
                case AUTH_TOO_MANY_REQUESTS:
                    replaceText(warningElem, tooManyFailedLogin);
                    closeAll();
                    showElement(warningElem);
                    disableAllInputs(false);
                    break;
                case AUTH_FAILED:
                    handleFailedLogin(
                        emailOtpPopupWindow === undefined ? loginPopupWindow : undefined,
                        () => {
                            disableAllInputs(false);
                        },
                        (loginPopupWindow) => {
                            modifyMfaReauthenticationPrompt(uri, callback, warningElem, content, loginPopupWindow);
                        },
                        loginFailed,
                    );
                    break;
                case 'FAILED EMAIL OTP':
                case 'SENT':
                    handleFailedEmailOtp(
                        emailOtpPopupWindow,
                        () => {
                            disableAllInputs(false);
                        },
                        (emailOtpPopupWindow) => {
                            modifyMfaReauthenticationPrompt(uri, callback, warningElem, content, loginPopupWindow, emailOtpPopupWindow);
                        },
                    );
                    break;
                default:
                    if (callback(response)) {
                        closeAll();
                    }
            }
        },
        [ServerRequestOptionKey.CONTENT]: joinHttpForms(
            content,
            buildHttpForm({
                email: loginPopupWindow[LoginPopupWindowKey.EMAIL],
                password: loginPopupWindow[LoginPopupWindowKey.PASSWORD],
                otp: emailOtpPopupWindow?.[EmailOtpPopupWindowKey.OTP],
            }),
        ),
        [ServerRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
    });
}

async function handleFailedEmailOtp(
    currentEmailOtpPopupWindow: EmailOtpPopupWindow | undefined,
    closeCallback: () => void,
    retryCallback: (emailOtpPopupWindow: EmailOtpPopupWindow) => void,
) {
    const currentPgid = pgid;
    let emailOtpPopupWindowPromise: Promise<EmailOtpPopupWindow>;
    if (currentEmailOtpPopupWindow === undefined) {
        emailOtpPopupWindowPromise = promptForEmailOtp();
    } else {
        emailOtpPopupWindowPromise = currentEmailOtpPopupWindow[EmailOtpPopupWindowKey.SHOW_WARNING]();
    }

    try {
        currentEmailOtpPopupWindow = await emailOtpPopupWindowPromise;
    } catch {
        if (currentPgid !== pgid) {
            return;
        }
        closeCallback();
        return;
    }
    if (currentPgid !== pgid) {
        return;
    }
    retryCallback(currentEmailOtpPopupWindow);
}

async function promptForTotpSetup(totpInfo: TOTPInfo) {
    const promptText = createParagraphElement('二要素認証を有効にするには、認証アプリを使用して以下のQRコードをスキャンするか、URIを直接入力してください。その後、下の入力欄に二要素認証コードを入力してください。');

    const totpURI = totpInfo[TOTPInfoKey.URI];
    const qrcode = createCanvasElement();
    addClass(qrcode, styles.totpQrcode);
    horizontalCenter(qrcode);
    toCanvas(qrcode, totpURI, { errorCorrectionLevel: 'H', margin: 0 }, () => {
        setHeight(qrcode, null);
    });

    const uriElem = createParagraphElement();
    addClass(uriElem, styles.totpUri);
    const uriLink = createAnchorElement();
    addClass(uriLink, linkClass);
    appendText(uriLink, totpURI);
    uriLink.href = totpURI;
    appendChild(uriElem, uriLink);

    const warningText = createParagraphElement(failedTotp);
    changeColor(warningText, CSS_COLOR.RED);
    hideElement(warningText);

    const totpInputField = createTotpInputField(false);
    const {
        [InputFieldElementKey.CONTAINER]: totpInputContainer,
        [InputFieldElementKey.INPUT]: totpInput,
    } = totpInputField;
    horizontalCenter(totpInputContainer);

    const submitButton = createStyledButtonElement(submitButtonText);
    const cancelButton = createStyledButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, popupWindowStyles.inputFlexbox);
    appendChild(buttonFlexbox, submitButton);
    appendChild(buttonFlexbox, cancelButton);

    const disableAllPopUpWindowInputs = (disabled: boolean) => {
        disableInputField(totpInputField, disabled);
        disableButton(submitButton, disabled);
        disableButton(cancelButton, disabled);
    };
    const submit = () => {
        disableAllPopUpWindowInputs(true);
        hideElement(warningText);

        const totp = totpInput.value;
        if (!/^\d{6}$/.test(totp)) {
            showElement(warningText);
            disableAllPopUpWindowInputs(false);
            return;
        }

        sendServerRequest('set_totp', {
            [ServerRequestOptionKey.CALLBACK]: (response: string) => {
                const mfaWarning = getSharedElement(SharedElement.mfaWarning);
                if (response === 'EXPIRED') {
                    hidePopupWindow();
                    replaceText(mfaWarning, sessionEnded);
                    showElement(mfaWarning);
                    disableAllInputs(false);
                } else if (response === 'FAILED TOTP') {
                    showElement(warningText);
                    disableAllPopUpWindowInputs(false);
                } else if (response === 'ALREADY SET') {
                    hidePopupWindow();
                    updateMfaUI(true);
                    changeColor(mfaWarning, CSS_COLOR.GREEN);
                    replaceText(mfaWarning, mfaAlreadySet);
                    showElement(mfaWarning);
                    disableAllInputs(false);
                } else {
                    showRecoveryCode(parseResponse(response, parseRecoveryCodeInfo), () => {
                        updateMfaUI(true);
                        changeColor(mfaWarning, CSS_COLOR.GREEN);
                        replaceText(mfaWarning, '二要素認証が有効になりました。');
                        showElement(mfaWarning);
                        disableAllInputs(false);
                    });
                }
            },
            [ServerRequestOptionKey.CONTENT]: buildHttpForm({ p: totpInfo[TOTPInfoKey.P], totp: totp }),
            [ServerRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
        });
    };
    addEventListener(submitButton, 'click', submit);
    addEventListener(totpInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            submit();
        }
    });
    addEventListener(cancelButton, 'click', () => {
        disableAllInputs(false);
        hidePopupWindow();
    });

    const hidePopupWindow = initializePopupWindow(
        [promptText, qrcode, uriElem, warningText, totpInputContainer, buttonFlexbox],
        () => {
            removeAllEventListeners(submitButton);
            removeAllEventListeners(cancelButton);
            removeAllEventListeners(totpInput);
        },
        () => { totpInput.focus(); },
    );
}

async function showRecoveryCode(recoveryCodes: RecoveryCodeInfo, completedCallback: () => void) {
    const promptText = createParagraphElement('リカバリーコードを安全な場所に保存してください。リカバリーコードは、二要素認証コードが利用できない場合にアカウントにアクセスするために使用できます。各リカバリコードは1回のみ使用できます。');

    const recoveryCodeContainer = createDivElement();
    addClass(recoveryCodeContainer, styles.recoveryCodes);
    for (const recoveryCode of recoveryCodes) {
        const recoveryCodeElem = createParagraphElement(recoveryCode);
        appendChild(recoveryCodeContainer, recoveryCodeElem);
    }

    const closeButton = createStyledButtonElement(closeButtonText + '（15秒）');
    horizontalCenter(closeButton);
    disableButton(closeButton, true);
    setCursor(closeButton, CSS_CURSOR.NOT_ALLOWED);
    let count = 15;
    let interval: Interval | null = addInterval(() => {
        count--;
        if (count <= 0) {
            disableButton(closeButton, false);
            setCursor(closeButton, null);
            replaceText(closeButton, closeButtonText);
            if (interval !== null) {
                removeInterval(interval);
                interval = null;
            }
        } else {
            replaceText(closeButton, closeButtonText + '（' + count + '秒）');
        }
    }, 1000);

    addEventListener(closeButton, 'click', () => {
        hidePopupWindow();
        completedCallback();
    });

    const hidePopupWindow = initializePopupWindow(
        [promptText, recoveryCodeContainer, closeButton],
        () => {
            removeAllEventListeners(closeButton);
            if (interval !== null) {
                removeInterval(interval);
                interval = null;
            }
        },
    );
}
