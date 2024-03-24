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
} from '../module/dom';
import { hideElement } from '../module/style';
import { myAccountPageTitle } from '../module/text/page_title';
import { changeButtonText, passwordRules, submitButtonText, usernameRule } from '../module/text/ui';
import { createUsernameInput } from '../module/dom/create_element/multi_language';

import * as styles from '../../css/my_account.module.scss';

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

let sharedBoolVars: { [key in SharedBoolVarsIdx]: boolean } | null = null;
let sharedInputVars: { [key in SharedInputVarsIdx]: HTMLInputElement } | null = null;
let sharedButtonVars: { [key in SharedButtonVarsIdx]: HTMLButtonElement } | null = null;
let sharedElementVars: { [key in SharedElementVarsIdx]: HTMLElement } | null = null;
export const sessionLogoutButtons = new Set<HTMLButtonElement>();

export function initializeSharedVars() {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);
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
    appendSubsection(container, 'お使いのデバイス', [sessionsContainer], null, [], null, []);

    const inviteCountInfo = createParagraphElement('保有している招待券の枚数：');
    const inviteCount = createSpanElement();
    appendChild(inviteCountInfo, inviteCount);
    const [inviteReceiverEmailContainer, inviteReceiverEmailInput] = createEmailInput();
    inviteReceiverEmailInput.autocomplete = 'off';
    const inviteSubsec = appendSubsection(container, 'ご招待', [inviteCountInfo], createParagraphElement(), [inviteReceiverEmailContainer], createButtonElement(submitButtonText), []);

    const logoutButton = createButtonElement('ログアウ');
    appendChild(container, logoutButton);

    sharedBoolVars = {
        [SharedBoolVarsIdx.currentMfaStatus]: false,
        [SharedBoolVarsIdx.currentLoginNotificationStatus]: false,
    };
    sharedInputVars = {
        [SharedInputVarsIdx.newUsernameInput]: usernameInput,
        [SharedInputVarsIdx.newPasswordInput]: passwordInput,
        [SharedInputVarsIdx.newPasswordComfirmInput]: passwordConfirmInput,
        [SharedInputVarsIdx.inviteReceiverEmailInput]: inviteReceiverEmailInput,
    };
    sharedButtonVars = {
        [SharedButtonVarsIdx.emailChangeButton]: changeEmailSubsec[1],
        [SharedButtonVarsIdx.usernameChangeButton]: usernameSubsec[1],
        [SharedButtonVarsIdx.passwordChangeButton]: passwordSubsec[1],
        [SharedButtonVarsIdx.inviteButton]: inviteSubsec[1],
        [SharedButtonVarsIdx.logoutButton]: logoutButton,
        [SharedButtonVarsIdx.mfaButton]: mfaSubsec[1],
        [SharedButtonVarsIdx.recoveryCodeButton]: recoveryCodeSubsec[1],
        [SharedButtonVarsIdx.loginNotificationButton]: loginNotificationSubsec[1],
    };
    sharedElementVars = {
        [SharedElementVarsIdx.emailWarning]: changeEmailSubsec[0],
        [SharedElementVarsIdx.usernameWarning]: usernameSubsec[0],
        [SharedElementVarsIdx.passwordWarning]: passwordSubsec[0],
        [SharedElementVarsIdx.inviteWarning]: inviteSubsec[0],
        [SharedElementVarsIdx.mfaWarning]: mfaSubsec[0],
        [SharedElementVarsIdx.recoveryCodeWarning]: recoveryCodeSubsec[0],
        [SharedElementVarsIdx.loginNotificationWarning]: loginNotificationSubsec[0],
        [SharedElementVarsIdx.inviteCount]: inviteCount,
        [SharedElementVarsIdx.mfaInfo]: mfaInfo,
        [SharedElementVarsIdx.recoveryCodeInfo]: recoveryCodeInfo,
        [SharedElementVarsIdx.loginNotificationInfo]: loginNotificationInfo,
        [SharedElementVarsIdx.sessionsContainer]: sessionsContainer,
    };
}

function triggerSharedVarAccessError(): never {
    throw new Error('Not initialized.');
}

export function setSharedBool(idx: SharedBoolVarsIdx, value: boolean) {
    if (sharedBoolVars === null) {
        triggerSharedVarAccessError();
    }
    sharedBoolVars[idx] = value;
}

export function getSharedBool(idx: SharedBoolVarsIdx) {
    if (sharedBoolVars === null) {
        triggerSharedVarAccessError();
    }
    return sharedBoolVars[idx];
}

export function getSharedInput(idx: SharedInputVarsIdx) {
    if (sharedInputVars === null) {
        triggerSharedVarAccessError();
    }
    return sharedInputVars[idx];
}

export function getSharedButton(idx: SharedButtonVarsIdx) {
    if (sharedButtonVars === null) {
        triggerSharedVarAccessError();
    }
    return sharedButtonVars[idx];
}

export function getSharedElement(idx: SharedElementVarsIdx) {
    if (sharedElementVars === null) {
        triggerSharedVarAccessError();
    }
    return sharedElementVars[idx];
}

export function dereferenceSharedVars() {
    sharedBoolVars = null;
    sharedInputVars = null;
    sharedButtonVars = null;
    sharedElementVars = null;
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