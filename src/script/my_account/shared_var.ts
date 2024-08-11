import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInput } from '../module/dom/element/input/password/create';
import { createEmailInput } from '../module/dom/element/input/email/create';
import { appendListItems } from '../module/dom/element/list/append_item';
import { createUListElement } from '../module/dom/element/list/ul/create';
import { createHRElement } from '../module/dom/element/hr/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { appendChild, appendChildren } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { hideElement } from '../module/style/hide_element';
import { myAccountPageTitle } from '../module/text/page_title';
import { changeButtonText, loading, passwordRules, submitButtonText, usernameRule } from '../module/text/ui';
import { createUsernameInput } from '../module/dom/element/input/username/create';
import * as styles from '../../css/my_account.module.scss';
import { addOffloadCallback } from '../module/global';
import { type StyledInputElement, StyledInputElementKey } from '../module/dom/element/input/type';

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
let sharedInputs: { [key in SharedInput]: StyledInputElement } | null = null;
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

    const changeEmailSubsec = appendSubsection(container, 'メールアドレス', [], createParagraphElement(), [], createStyledButtonElement(changeButtonText), []);

    const usernameStyledInput = createUsernameInput();
    const usernameSubsec = appendSubsection(container, 'ユーザー名', [], createParagraphElement(), [usernameStyledInput[StyledInputElementKey.CONTAINER]], createStyledButtonElement(changeButtonText), [usernameRule]);

    const passwordStyledInput = createPasswordInput(true, '新しいパスワード');
    const passwordConfirmStyledInput = createPasswordInput(true, '確認再入力');
    const passwordSubsec = appendSubsection(container, 'パスワード', [], createParagraphElement(), [passwordStyledInput[StyledInputElementKey.CONTAINER], passwordConfirmStyledInput[StyledInputElementKey.CONTAINER]], createStyledButtonElement(changeButtonText), passwordRules);

    const mfaInfo = createParagraphElement();
    const mfaSubsec = appendSubsection(container, '二要素認証', [mfaInfo], createParagraphElement(), [], createStyledButtonElement(), []);

    const recoveryCodeInfo = createParagraphElement();
    const recoveryCodeSubsec = appendSubsection(container, 'リカバリーコード', [recoveryCodeInfo], createParagraphElement(), [], createStyledButtonElement('生成する'), ['新しいコードを生成すると、既存のコードは無効になります。']);

    const loginNotificationInfo = createParagraphElement();
    const loginNotificationSubsec = appendSubsection(container, 'ログイン通知メール', [loginNotificationInfo], createParagraphElement(), [], createStyledButtonElement(), []);

    const sessionsContainer = createDivElement();
    addClass(sessionsContainer, styles.sessions);
    const sessionsLoadingText = createParagraphElement(loading);
    appendChild(sessionsContainer, sessionsLoadingText);
    appendSubsection(container, 'お使いのデバイス', [sessionsContainer], null, [], null, []);

    const inviteCountInfo = createParagraphElement('保有している招待券の枚数：');
    const inviteCount = createSpanElement();
    appendChild(inviteCountInfo, inviteCount);
    const inviteReceiverEmailStyledInput = createEmailInput();
    inviteReceiverEmailStyledInput[StyledInputElementKey.INPUT].autocomplete = 'off';
    const inviteSubsec = appendSubsection(container, 'ご招待', [inviteCountInfo], createParagraphElement(), [inviteReceiverEmailStyledInput[StyledInputElementKey.CONTAINER]], createStyledButtonElement(submitButtonText), []);

    const logoutButton = createStyledButtonElement('ログアウ');
    appendChild(container, logoutButton);

    sharedBools = {
        [SharedBool.currentMfaStatus]: false,
        [SharedBool.currentLoginNotificationStatus]: false,
    };
    sharedInputs = {
        [SharedInput.newUsernameInput]: usernameStyledInput,
        [SharedInput.newPasswordInput]: passwordStyledInput,
        [SharedInput.newPasswordComfirmInput]: passwordConfirmStyledInput,
        [SharedInput.inviteReceiverEmailInput]: inviteReceiverEmailStyledInput,
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

export function getSharedStyledInput(idx: SharedInput) {
    if (sharedInputs === null) {
        triggerSharedVarAccessError();
    }
    return sharedInputs[idx];
}

export function getSharedInput(idx: SharedInput) {
    if (sharedInputs === null) {
        triggerSharedVarAccessError();
    }
    return sharedInputs[idx][StyledInputElementKey.INPUT];
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
