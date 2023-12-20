import {
    getById,
} from '../module/dom';

let sharedBoolVars: boolean[];
let sharedInputVars: HTMLInputElement[];
let sharedButtonVars: HTMLButtonElement[];
let sharedElementVars: HTMLElement[];

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

    sharedInputVars = [
        getById('new-username') as HTMLInputElement,
        getById('new-password') as HTMLInputElement,
        getById('new-password-confirm') as HTMLInputElement,
        getById('receiver-email') as HTMLInputElement,
    ];

    sharedButtonVars = [
        getById('email-change-button') as HTMLButtonElement,
        getById('username-change-button') as HTMLButtonElement,
        getById('password-change-button') as HTMLButtonElement,
        getById('invite-button') as HTMLButtonElement,
        getById('logout-button') as HTMLButtonElement,
        getById('mfa-button') as HTMLButtonElement,
        getById('recovery-code-button') as HTMLButtonElement,
        getById('login-notification-button') as HTMLButtonElement,
    ];

    sharedElementVars = [
        getById('email-warning'),
        getById('username-warning'),
        getById('password-warning'),
        getById('invite-warning'),
        getById('mfa-warning'),
        getById('recovery-code-warning'),
        getById('login-notification-warning'),

        getById('invite-count'),
        getById('mfa-info'),
        getById('recovery-code-info'),
        getById('login-notification-info'),
        getById('sessions'),
    ];
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
}