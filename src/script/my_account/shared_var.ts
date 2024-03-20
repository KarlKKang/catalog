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

let sharedBoolVars: boolean[];
let sharedInputVars: HTMLInputElement[];
let sharedButtonVars: HTMLButtonElement[];
let sharedElementVars: HTMLElement[];
export const sessionLogoutButtons = new Set<HTMLButtonElement>();

const enum SharedBoolVarsIdx {
    currentMfaStatus,
    currentLoginNotificationStatus,
}

const enum SharedInputVarsIdx {
    newUsernameInput,
    newPasswordInput,
    newPasswordComfirmInput,
    inviteReceiverEmailInput,
}

const enum SharedButtonVarsIdx {
    emailChangeButton,
    usernameChangeButton,
    passwordChangeButton,
    inviteButton,
    logoutButton,
    mfaButton,
    recoveryCodeButton,
    loginNotificationButton,
}

const enum SharedElementVarsIdx {
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

export const SHARED_VAR_IDX_CURRENT_MFA_STATUS = SharedBoolVarsIdx.currentMfaStatus;
export const SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS = SharedBoolVarsIdx.currentLoginNotificationStatus;
export const SHARED_VAR_IDX_NEW_USERNAME_INPUT = SharedInputVarsIdx.newUsernameInput;
export const SHARED_VAR_IDX_NEW_PASSWORD_INPUT = SharedInputVarsIdx.newPasswordInput;
export const SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT = SharedInputVarsIdx.newPasswordComfirmInput;
export const SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT = SharedInputVarsIdx.inviteReceiverEmailInput;
export const SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON = SharedButtonVarsIdx.emailChangeButton;
export const SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON = SharedButtonVarsIdx.usernameChangeButton;
export const SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON = SharedButtonVarsIdx.passwordChangeButton;
export const SHARED_VAR_IDX_INVITE_BUTTON = SharedButtonVarsIdx.inviteButton;
export const SHARED_VAR_IDX_LOGOUT_BUTTON = SharedButtonVarsIdx.logoutButton;
export const SHARED_VAR_IDX_MFA_BUTTON = SharedButtonVarsIdx.mfaButton;
export const SHARED_VAR_IDX_RECOVERY_CODE_BUTTON = SharedButtonVarsIdx.recoveryCodeButton;
export const SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON = SharedButtonVarsIdx.loginNotificationButton;
export const SHARED_VAR_IDX_EMAIL_WARNING = SharedElementVarsIdx.emailWarning;
export const SHARED_VAR_IDX_USERNAME_WARNING = SharedElementVarsIdx.usernameWarning;
export const SHARED_VAR_IDX_PASSWORD_WARNING = SharedElementVarsIdx.passwordWarning;
export const SHARED_VAR_IDX_INVITE_WARNING = SharedElementVarsIdx.inviteWarning;
export const SHARED_VAR_IDX_MFA_WARNING = SharedElementVarsIdx.mfaWarning;
export const SHARED_VAR_IDX_RECOVERY_CODE_WARNING = SharedElementVarsIdx.recoveryCodeWarning;
export const SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING = SharedElementVarsIdx.loginNotificationWarning;
export const SHARED_VAR_IDX_INVITE_COUNT = SharedElementVarsIdx.inviteCount;
export const SHARED_VAR_IDX_MFA_INFO = SharedElementVarsIdx.mfaInfo;
export const SHARED_VAR_IDX_RECOVERY_CODE_INFO = SharedElementVarsIdx.recoveryCodeInfo;
export const SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO = SharedElementVarsIdx.loginNotificationInfo;
export const SHARED_VAR_IDX_SESSIONS_CONTAINER = SharedElementVarsIdx.sessionsContainer;

export function initializeSharedVars() {
    sharedBoolVars = [];
    sharedInputVars = [];
    sharedButtonVars = [];
    sharedElementVars = [];

    const container = createDivElement();
    container.id = 'container';
    appendChild(body, container);
    const titleElem = createParagraphElement(myAccountPageTitle);
    titleElem.id = 'title';
    appendChild(container, titleElem);
    appendSubsection(container, 'メールアドレス', [], SHARED_VAR_IDX_EMAIL_WARNING, [], SHARED_VAR_IDX_EMAIL_CHANGE_BUTTON, changeButtonText, []);

    const [usernameContainer, usernameInput] = createUsernameInput();
    sharedInputVars[SHARED_VAR_IDX_NEW_USERNAME_INPUT] = usernameInput;
    appendSubsection(container, 'ユーザー名', [], SHARED_VAR_IDX_USERNAME_WARNING, [usernameContainer], SHARED_VAR_IDX_USERNAME_CHANGE_BUTTON, changeButtonText, [usernameRule]);

    const [passwordContainer, passwordInput] = createPasswordInput(true, '新しいパスワード');
    const [passwordConfirmContainer, passwordConfirmInput] = createPasswordInput(true, '確認再入力');
    sharedInputVars[SHARED_VAR_IDX_NEW_PASSWORD_INPUT] = passwordInput;
    sharedInputVars[SHARED_VAR_IDX_NEW_PASSWORD_CONFIRM_INPUT] = passwordConfirmInput;
    appendSubsection(container, 'パスワード', [], SHARED_VAR_IDX_PASSWORD_WARNING, [passwordContainer, passwordConfirmContainer], SHARED_VAR_IDX_PASSWORD_CHANGE_BUTTON, changeButtonText, passwordRules);

    const mfaInfo = createParagraphElement();
    sharedElementVars[SHARED_VAR_IDX_MFA_INFO] = mfaInfo;
    appendSubsection(container, '二要素認証', [mfaInfo], SHARED_VAR_IDX_MFA_WARNING, [], SHARED_VAR_IDX_MFA_BUTTON, undefined, []);

    const recoveryCodeInfo = createParagraphElement();
    sharedElementVars[SHARED_VAR_IDX_RECOVERY_CODE_INFO] = recoveryCodeInfo;
    appendSubsection(container, 'リカバリーコード', [recoveryCodeInfo], SHARED_VAR_IDX_RECOVERY_CODE_WARNING, [], SHARED_VAR_IDX_RECOVERY_CODE_BUTTON, '生成する', ['新しいコードを生成すると、既存のコードは無効になります。']);

    const loginNotificationInfo = createParagraphElement();
    sharedElementVars[SHARED_VAR_IDX_LOGIN_NOTIFICATION_INFO] = loginNotificationInfo;
    appendSubsection(container, 'ログイン通知メール', [loginNotificationInfo], SHARED_VAR_IDX_LOGIN_NOTIFICATION_WARNING, [], SHARED_VAR_IDX_LOGIN_NOTIFICATION_BUTTON, undefined, []);

    const sessionsContainer = createDivElement();
    sessionsContainer.id = 'sessions';
    sharedElementVars[SHARED_VAR_IDX_SESSIONS_CONTAINER] = sessionsContainer;
    appendSubsection(container, 'お使いのデバイス', [sessionsContainer], null, [], null, undefined, []);

    const inviteCountInfo = createParagraphElement('保有している招待券の枚数：');
    const inviteCount = createSpanElement();
    sharedElementVars[SHARED_VAR_IDX_INVITE_COUNT] = inviteCount;
    appendChild(inviteCountInfo, inviteCount);
    const [inviteReceiverEmailContainer, inviteReceiverEmailInput] = createEmailInput();
    inviteReceiverEmailInput.autocomplete = 'off';
    sharedInputVars[SHARED_VAR_IDX_INVITE_RECEIVER_EMAIL_INPUT] = inviteReceiverEmailInput;
    appendSubsection(container, 'ご招待', [inviteCountInfo], SHARED_VAR_IDX_INVITE_WARNING, [inviteReceiverEmailContainer], SHARED_VAR_IDX_INVITE_BUTTON, submitButtonText, []);

    const logoutButton = createButtonElement('ログアウ');
    sharedButtonVars[SHARED_VAR_IDX_LOGOUT_BUTTON] = logoutButton;
    appendChild(container, logoutButton);
}

export function setCurrentMfaStatus(status: boolean) {
    sharedBoolVars[SHARED_VAR_IDX_CURRENT_MFA_STATUS] = status;
}

export function setCurrentLoginNotificationStatus(status: boolean) {
    sharedBoolVars[SHARED_VAR_IDX_CURRENT_LOGIN_NOTIFICATION_STATUS] = status;
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
    addClass(titleElem, 'sub-title');
    appendChild(container, titleElem);

    appendChildren(container, ...infoElements);

    if (warningIndex !== null) {
        const warningElem = createParagraphElement();
        addClass(warningElem, 'warning');
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
        addClass(noteElem, 'note');
        appendListItems(noteElem, ...notes);
        appendChild(container, noteElem);
    }

    const hr = createHRElement();
    appendChild(container, hr);
}