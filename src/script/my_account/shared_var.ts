import { appendListItems, createButtonElement, createDivElement, createEmailInput, createHRElement, createParagraphElement, createPasswordInput, createSpanElement, createUListElement } from '../module/dom/create_element';
import { appendChild, appendChildren } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { hideElement } from '../module/style/hide_element';
import { myAccountPageTitle } from '../module/text/page_title';
import { changeButtonText, loading, passwordRules, submitButtonText, usernameRule } from '../module/text/ui';
import { createUsernameInput } from '../module/dom/create_element/multi_language';
import * as styles from '../../css/my_account.module.scss';
import { addOffloadCallback } from '../module/global';

export const enum SharedBool {
    currentMfaStatus,
    currentLoginNotificationStatus,
}

export const enum SharedInput {
    newUsernameInput,
    newPasswordInput,
    newPasswordComfirmInput,
    inviteReceiverEmailInput,
}

export const enum SharedButton {
    emailChangeButton,
    usernameChangeButton,
    passwordChangeButton,
    inviteButton,
    logoutButton,
    mfaButton,
    recoveryCodeButton,
    loginNotificationButton,
}

export const enum SharedElement {
    emailWarning,
    usernameWarning,
    passwordWarning,
    inviteWarning,
    mfaWarning,
    recoveryCodeWarning,
    loginNotificationWarning,
    inviteCount,
    mfaInfo,
    recoveryCodeInfo,
    loginNotificationInfo,
    sessionsContainer,
}

let sharedBools: { [key in SharedBool]: boolean } | null = null;
let sharedInputs: { [key in SharedInput]: HTMLInputElement } | null = null;
let sharedButtons: { [key in SharedButton]: HTMLButtonElement } | null = null;
let sharedElements: { [key in SharedElement]: HTMLElement } | null = null;
export const sessionLogoutButtons = new Set<HTMLButtonElement>();

export function initializeSharedVars() {
    addOffloadCallback(dereferenceSharedVars);

    const container = createDivElement();
    addClass(container, styles.container);
    const titleElem = createParagraphElement(myAccountPageTitle);
    addClass(titleElem, styles.title);
    appendChild(container, titleElem);

    const changeEmailSubsec = appendSubsection(container, 'メールアドレス', [], createParagraphElement(), [], createButtonElement(changeButtonText), []);

    const [usernameContainer, usernameInput] = createUsernameInput();
    const usernameSubsec = appendSubsection(container, 'ユーザー名', [], createParagraphElement(), [usernameContainer], createButtonElement(changeButtonText), [usernameRule]);

    const [passwordContainer, passwordInput] = createPasswordInput(true, '新しいパスワード');
    const [passwordConfirmContainer, passwordConfirmInput] = createPasswordInput(true, '確認再入力');
    const passwordSubsec = appendSubsection(container, 'パスワード', [], createParagraphElement(), [passwordContainer, passwordConfirmContainer], createButtonElement(changeButtonText), passwordRules);

    const mfaInfo = createParagraphElement();
    const mfaSubsec = appendSubsection(container, '二要素認証', [mfaInfo], createParagraphElement(), [], createButtonElement(), []);

    const recoveryCodeInfo = createParagraphElement();
    const recoveryCodeSubsec = appendSubsection(container, 'リカバリーコード', [recoveryCodeInfo], createParagraphElement(), [], createButtonElement('生成する'), ['新しいコードを生成すると、既存のコードは無効になります。']);

    const loginNotificationInfo = createParagraphElement();
    const loginNotificationSubsec = appendSubsection(container, 'ログイン通知メール', [loginNotificationInfo], createParagraphElement(), [], createButtonElement(), []);

    const sessionsContainer = createDivElement();
    addClass(sessionsContainer, styles.sessions);
    const sessionsLoadingText = createParagraphElement(loading);
    appendChild(sessionsContainer, sessionsLoadingText);
    appendSubsection(container, 'お使いのデバイス', [sessionsContainer], null, [], null, []);

    const inviteCountInfo = createParagraphElement('保有している招待券の枚数：');
    const inviteCount = createSpanElement();
    appendChild(inviteCountInfo, inviteCount);
    const [inviteReceiverEmailContainer, inviteReceiverEmailInput] = createEmailInput();
    inviteReceiverEmailInput.autocomplete = 'off';
    const inviteSubsec = appendSubsection(container, 'ご招待', [inviteCountInfo], createParagraphElement(), [inviteReceiverEmailContainer], createButtonElement(submitButtonText), []);

    const logoutButton = createButtonElement('ログアウ');
    appendChild(container, logoutButton);

    sharedBools = {
        [SharedBool.currentMfaStatus]: false,
        [SharedBool.currentLoginNotificationStatus]: false,
    };
    sharedInputs = {
        [SharedInput.newUsernameInput]: usernameInput,
        [SharedInput.newPasswordInput]: passwordInput,
        [SharedInput.newPasswordComfirmInput]: passwordConfirmInput,
        [SharedInput.inviteReceiverEmailInput]: inviteReceiverEmailInput,
    };
    sharedButtons = {
        [SharedButton.emailChangeButton]: changeEmailSubsec[1],
        [SharedButton.usernameChangeButton]: usernameSubsec[1],
        [SharedButton.passwordChangeButton]: passwordSubsec[1],
        [SharedButton.inviteButton]: inviteSubsec[1],
        [SharedButton.logoutButton]: logoutButton,
        [SharedButton.mfaButton]: mfaSubsec[1],
        [SharedButton.recoveryCodeButton]: recoveryCodeSubsec[1],
        [SharedButton.loginNotificationButton]: loginNotificationSubsec[1],
    };
    sharedElements = {
        [SharedElement.emailWarning]: changeEmailSubsec[0],
        [SharedElement.usernameWarning]: usernameSubsec[0],
        [SharedElement.passwordWarning]: passwordSubsec[0],
        [SharedElement.inviteWarning]: inviteSubsec[0],
        [SharedElement.mfaWarning]: mfaSubsec[0],
        [SharedElement.recoveryCodeWarning]: recoveryCodeSubsec[0],
        [SharedElement.loginNotificationWarning]: loginNotificationSubsec[0],
        [SharedElement.inviteCount]: inviteCount,
        [SharedElement.mfaInfo]: mfaInfo,
        [SharedElement.recoveryCodeInfo]: recoveryCodeInfo,
        [SharedElement.loginNotificationInfo]: loginNotificationInfo,
        [SharedElement.sessionsContainer]: sessionsContainer,
    };

    return container;
}

function triggerSharedVarAccessError(): never {
    throw new Error('Not initialized.');
}

export function setSharedBool(idx: SharedBool, value: boolean) {
    if (sharedBools === null) {
        triggerSharedVarAccessError();
    }
    sharedBools[idx] = value;
}

export function getSharedBool(idx: SharedBool) {
    if (sharedBools === null) {
        triggerSharedVarAccessError();
    }
    return sharedBools[idx];
}

export function getSharedInput(idx: SharedInput) {
    if (sharedInputs === null) {
        triggerSharedVarAccessError();
    }
    return sharedInputs[idx];
}

export function getSharedButton(idx: SharedButton) {
    if (sharedButtons === null) {
        triggerSharedVarAccessError();
    }
    return sharedButtons[idx];
}

export function getSharedElement(idx: SharedElement) {
    if (sharedElements === null) {
        triggerSharedVarAccessError();
    }
    return sharedElements[idx];
}

function dereferenceSharedVars() {
    sharedBools = null;
    sharedInputs = null;
    sharedButtons = null;
    sharedElements = null;
    sessionLogoutButtons.clear();
}

function appendSubsection<T extends (HTMLElement | null), U extends (HTMLButtonElement | null)>(
    container: HTMLDivElement,
    title: string,
    infoElements: HTMLElement[],
    warningElem: T,
    inputContainers: HTMLElement[],
    buttonElem: U,
    notes: string[],
): [T, U] {
    const titleElem = createParagraphElement(title);
    addClass(titleElem, styles.subTitle);
    appendChild(container, titleElem);

    appendChildren(container, ...infoElements);

    if (warningElem !== null) {
        addClass(warningElem, styles.warning);
        hideElement(warningElem);
        appendChild(container, warningElem);
    }

    appendChildren(container, ...inputContainers);

    if (buttonElem !== null) {
        appendChild(container, buttonElem);
    }

    if (notes.length !== 0) {
        const noteElem = createUListElement();
        addClass(noteElem, styles.note);
        appendListItems(noteElem, ...notes);
        appendChild(container, noteElem);
    }

    const hr = createHRElement();
    appendChild(container, hr);

    return [warningElem, buttonElem];
}
