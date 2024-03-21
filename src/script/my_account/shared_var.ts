import {
    addClass,
    appendChild,
    appendChildren,
    appendListItems,
    body,
    createButtonElement,
    createDivElement,
    createEmailInput,
    createHRElement,
    createParagraphElement,
    createPasswordInput,
    createSpanElement,
    createUListElement,
    createUsernameInput,
} from '../module/dom';
import { hideElement } from '../module/style';
import { myAccountPageTitle } from '../module/text/page_title';
import { changeButtonText, passwordRules, submitButtonText, usernameRule } from '../module/text/ui';

import * as styles from '../../css/my_account.module.scss';

let sharedBoolVars: boolean[];
let sharedInputVars: HTMLInputElement[];
let sharedButtonVars: HTMLButtonElement[];
let sharedElementVars: HTMLElement[];
export const sessionLogoutButtons = new Set<HTMLButtonElement>();

export const enum SharedBoolVarsIdx {
    currentMfaStatus,
    currentLoginNotificationStatus,
}

export const enum SharedInputVarsIdx {
    newUsernameInput,
    newPasswordInput,
    newPasswordComfirmInput,
    inviteReceiverEmailInput,
}

export const enum SharedButtonVarsIdx {
    emailChangeButton,
    usernameChangeButton,
    passwordChangeButton,
    inviteButton,
    logoutButton,
    mfaButton,
    recoveryCodeButton,
    loginNotificationButton,
}

export const enum SharedElementVarsIdx {
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

export function initializeSharedVars() {
    sharedBoolVars = [];
    sharedInputVars = [];
    sharedButtonVars = [];
    sharedElementVars = [];

    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);
    const titleElem = createParagraphElement(myAccountPageTitle);
    addClass(titleElem, styles.title);
    appendChild(container, titleElem);
    appendSubsection(container, 'メールアドレス', [], SharedElementVarsIdx.emailWarning, [], SharedButtonVarsIdx.emailChangeButton, changeButtonText, []);

    const [usernameContainer, usernameInput] = createUsernameInput();
    sharedInputVars[SharedInputVarsIdx.newUsernameInput] = usernameInput;
    appendSubsection(container, 'ユーザー名', [], SharedElementVarsIdx.usernameWarning, [usernameContainer], SharedButtonVarsIdx.usernameChangeButton, changeButtonText, [usernameRule]);

    const [passwordContainer, passwordInput] = createPasswordInput(true, '新しいパスワード');
    const [passwordConfirmContainer, passwordConfirmInput] = createPasswordInput(true, '確認再入力');
    sharedInputVars[SharedInputVarsIdx.newPasswordInput] = passwordInput;
    sharedInputVars[SharedInputVarsIdx.newPasswordComfirmInput] = passwordConfirmInput;
    appendSubsection(container, 'パスワード', [], SharedElementVarsIdx.passwordWarning, [passwordContainer, passwordConfirmContainer], SharedButtonVarsIdx.passwordChangeButton, changeButtonText, passwordRules);

    const mfaInfo = createParagraphElement();
    sharedElementVars[SharedElementVarsIdx.mfaInfo] = mfaInfo;
    appendSubsection(container, '二要素認証', [mfaInfo], SharedElementVarsIdx.mfaWarning, [], SharedButtonVarsIdx.mfaButton, undefined, []);

    const recoveryCodeInfo = createParagraphElement();
    sharedElementVars[SharedElementVarsIdx.recoveryCodeInfo] = recoveryCodeInfo;
    appendSubsection(container, 'リカバリーコード', [recoveryCodeInfo], SharedElementVarsIdx.recoveryCodeWarning, [], SharedButtonVarsIdx.recoveryCodeButton, '生成する', ['新しいコードを生成すると、既存のコードは無効になります。']);

    const loginNotificationInfo = createParagraphElement();
    sharedElementVars[SharedElementVarsIdx.loginNotificationInfo] = loginNotificationInfo;
    appendSubsection(container, 'ログイン通知メール', [loginNotificationInfo], SharedElementVarsIdx.loginNotificationWarning, [], SharedButtonVarsIdx.loginNotificationButton, undefined, []);

    const sessionsContainer = createDivElement();
    addClass(sessionsContainer, styles.sessions);
    sharedElementVars[SharedElementVarsIdx.sessionsContainer] = sessionsContainer;
    appendSubsection(container, 'お使いのデバイス', [sessionsContainer], null, [], null, undefined, []);

    const inviteCountInfo = createParagraphElement('保有している招待券の枚数：');
    const inviteCount = createSpanElement();
    sharedElementVars[SharedElementVarsIdx.inviteCount] = inviteCount;
    appendChild(inviteCountInfo, inviteCount);
    const [inviteReceiverEmailContainer, inviteReceiverEmailInput] = createEmailInput();
    inviteReceiverEmailInput.autocomplete = 'off';
    sharedInputVars[SharedInputVarsIdx.inviteReceiverEmailInput] = inviteReceiverEmailInput;
    appendSubsection(container, 'ご招待', [inviteCountInfo], SharedElementVarsIdx.inviteWarning, [inviteReceiverEmailContainer], SharedButtonVarsIdx.inviteButton, submitButtonText, []);

    const logoutButton = createButtonElement('ログアウ');
    sharedButtonVars[SharedButtonVarsIdx.logoutButton] = logoutButton;
    appendChild(container, logoutButton);
}

export function setSharedBool(idx: SharedBoolVarsIdx, value: boolean) {
    sharedBoolVars[idx] = value;
}

function triggerSharedVarAccessError(): never {
    throw new Error('Cannot access shared variable.');
}

export function getSharedBool(idx: SharedBoolVarsIdx) {
    const value = sharedBoolVars[idx];
    if (value === undefined) {
        triggerSharedVarAccessError();
    }
    return value;
}

export function getSharedInput(idx: SharedInputVarsIdx) {
    const value = sharedInputVars[idx];
    if (value === undefined) {
        triggerSharedVarAccessError();
    }
    return value;
}

export function getSharedButton(idx: SharedButtonVarsIdx) {
    const value = sharedButtonVars[idx];
    if (value === undefined) {
        triggerSharedVarAccessError();
    }
    return value;
}

export function getSharedElement(idx: SharedElementVarsIdx) {
    const value = sharedElementVars[idx];
    if (value === undefined) {
        triggerSharedVarAccessError();
    }
    return value;
}

export function dereferenceSharedVars() {
    sharedBoolVars = [];
    sharedInputVars = [];
    sharedButtonVars = [];
    sharedElementVars = [];
    sessionLogoutButtons.clear();
}

function appendSubsection(
    container: HTMLDivElement,
    title: string,
    infoElements: HTMLElement[],
    warningIndex: SharedElementVarsIdx | null,
    inputContainers: HTMLElement[],
    buttonIndex: SharedButtonVarsIdx | null,
    buttonText: string | undefined,
    notes: string[],
) {
    const titleElem = createParagraphElement(title);
    addClass(titleElem, styles.subTitle);
    appendChild(container, titleElem);

    appendChildren(container, ...infoElements);

    if (warningIndex !== null) {
        const warningElem = createParagraphElement();
        addClass(warningElem, styles.warning);
        hideElement(warningElem);
        appendChild(container, warningElem);
        sharedElementVars[warningIndex] = warningElem;
    }

    appendChildren(container, ...inputContainers);

    if (buttonIndex !== null) {
        const button = createButtonElement(buttonText);
        appendChild(container, button);
        sharedButtonVars[buttonIndex] = button;
    }

    if (notes.length !== 0) {
        const noteElem = createUListElement();
        addClass(noteElem, styles.note);
        appendListItems(noteElem, ...notes);
        appendChild(container, noteElem);
    }

    const hr = createHRElement();
    appendChild(container, hr);
}