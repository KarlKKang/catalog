import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import { addEventListener } from '../module/event_listener';
import { appendText, createAnchorElement, createButtonElement, createCanvasElement, createDivElement, createParagraphElement, createTotpInput, replaceText } from '../module/dom/create_element';
import { disableButton, disableInput } from '../module/dom/change_input';
import { appendChild, replaceChildren } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import {
    failedTotp,
    sessionEnded,
    accountDeactivated,
    tooManyFailedLogin,
    loginFailed,
} from '../module/text/message/body';
import { type TOTPInfo, TOTPInfoKey, parseTotpInfo } from '../module/type/TOTPInfo';
import { toCanvas } from 'qrcode';
import { addInterval, removeInterval } from '../module/timer';
import { pgid } from '../module/global';
import { SharedBool, SharedButton, SharedElement, getSharedBool, getSharedButton, getSharedElement } from './shared_var';
import { updateMfaUI, disableAllInputs, mfaNotSet } from './helper';
import { handleFailedLogin, reauthenticationPrompt } from './auth_helper';
import { promptForEmailOtp, type EmailOtpPopupWindow, EmailOtpPopupWindowKey } from './email_otp_popup_window';
import { LoginPopupWindowKey, type LoginPopupWindow } from './login_popup_window';
import { AUTH_DEACTIVATED, AUTH_FAILED, AUTH_FAILED_TOTP, AUTH_TOO_MANY_REQUESTS } from '../module/auth_results';
import { buildURLForm, joinURLForms } from '../module/http_form';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { setCursor, CSS_CURSOR } from '../module/style/cursor';
import { setHeight } from '../module/style/height';
import { changeColor, CSS_COLOR } from '../module/style/color';
import { cancelButtonText, closeButtonText, submitButtonText } from '../module/text/ui';
import * as commonStyles from '../../css/common.module.scss';
import * as styles from '../../css/my_account.module.scss';
import { type RecoveryCodeInfo, parseRecoveryCodeInfo } from '../module/type/RecoveryCodeInfo';
import { initializePopupWindow, styles as popupWindowStyles } from '../module/popup_window/core';

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
        [ServerRequestOptionProp.CALLBACK]: (response: string) => {
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
        [ServerRequestOptionProp.CONTENT]: joinURLForms(
            content,
            buildURLForm({
                email: loginPopupWindow[LoginPopupWindowKey.EMAIL],
                password: loginPopupWindow[LoginPopupWindowKey.PASSWORD],
                otp: emailOtpPopupWindow?.[EmailOtpPopupWindowKey.OTP],
            }),
        ),
        [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
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
    addClass(uriLink, commonStyles.link);
    appendText(uriLink, totpURI);
    uriLink.href = totpURI;
    appendChild(uriElem, uriLink);

    const warningText = createParagraphElement(failedTotp);
    changeColor(warningText, CSS_COLOR.RED);
    hideElement(warningText);

    const [totpInputContainer, totpInput] = createTotpInput(false);
    horizontalCenter(totpInputContainer);

    const submitButton = createButtonElement(submitButtonText);
    const cancelButton = createButtonElement(cancelButtonText);
    const buttonFlexbox = createDivElement();
    addClass(buttonFlexbox, popupWindowStyles.inputFlexbox);
    appendChild(buttonFlexbox, submitButton);
    appendChild(buttonFlexbox, cancelButton);

    const hidePopupWindow = initializePopupWindow(
        [promptText, qrcode, uriElem, warningText, totpInputContainer, buttonFlexbox],
        () => { totpInput.focus(); },
    );

    const disableAllPopUpWindowInputs = (disabled: boolean) => {
        disableInput(totpInput, disabled);
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
            [ServerRequestOptionProp.CALLBACK]: (response: string) => {
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
            [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: totpInfo[TOTPInfoKey.P], totp: totp }),
            [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
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
}

async function showRecoveryCode(recoveryCodes: RecoveryCodeInfo, completedCallback: () => void) {
    const promptText = createParagraphElement('リカバリーコードを安全な場所に保存してください。リカバリーコードは、二要素認証コードが利用できない場合にアカウントにアクセスするために使用できます。各リカバリコードは1回のみ使用できます。');

    const recoveryCodeContainer = createDivElement();
    addClass(recoveryCodeContainer, styles.recoveryCodes);
    for (const recoveryCode of recoveryCodes) {
        const recoveryCodeElem = createParagraphElement(recoveryCode);
        appendChild(recoveryCodeContainer, recoveryCodeElem);
    }

    const closeButton = createButtonElement(closeButtonText + '（15秒）');
    horizontalCenter(closeButton);
    disableButton(closeButton, true);
    setCursor(closeButton, CSS_CURSOR.NOT_ALLOWED);
    let count = 15;
    const interval = addInterval(() => {
        count--;
        if (count <= 0) {
            disableButton(closeButton, false);
            setCursor(closeButton, null);
            replaceText(closeButton, closeButtonText);
            removeInterval(interval);
        } else {
            replaceText(closeButton, closeButtonText + '（' + count + '秒）');
        }
    }, 1000);

    const hidePopupWindow = initializePopupWindow([promptText, recoveryCodeContainer, closeButton]);

    addEventListener(closeButton, 'click', () => {
        hidePopupWindow();
        completedCallback();
    });
}
