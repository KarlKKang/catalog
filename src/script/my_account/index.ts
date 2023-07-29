// JavaScript Document
import {
    LOGIN_URL,
} from '../module/env/constant';
import {
    addNavBar,
    passwordStyling,
    sendServerRequest,
    changeColor,
    clearCookies,
    hashPassword,
    disableInput,
    PASSWORD_REGEX,
    EMAIL_REGEX,
    logout
} from '../module/main';
import {
    addEventListener,
    getBaseURL,
    redirect,
    getById,
    getBody,
    showElement,
    hideElement,
    appendText,
    replaceText,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { emailSent as emailSentParam } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import {
    invitationNotQualified,
    invalidEmailFormat,
    emailAlreadyRegistered,
    invitationClosed,
    emailSent as emailSentInline,
    invalidPasswordFormat,
    passwordConfirmationMismatch,
    passwordChanged,
    usernameEmpty,
    usernameUnchanged,
    usernameChanged,
    usernameTaken,
    emailChangeWait
} from '../module/message/template/inline';
import * as UserInfo from '../module/type/UserInfo';
import isbot from 'isbot';
import body from './body.html';

let currentUsername: string;

let newUsernameInput: HTMLInputElement;
let newPasswordInput: HTMLInputElement;
let newPasswordComfirmInput: HTMLInputElement;
let inviteReceiverEmailInput: HTMLInputElement;

let emailChangeButton: HTMLButtonElement;
let usernameChangeButton: HTMLButtonElement;
let passwordChangeButton: HTMLButtonElement;
let inviteButton: HTMLButtonElement;
let logoutButton: HTMLButtonElement;

export default function () {
    clearCookies();

    if (navigator !== undefined && isbot(navigator.userAgent)) {
        return;
    }

    sendServerRequest('get_account.php', {
        callback: function (response: string) {
            let parsedResponse: UserInfo.UserInfo;
            try {
                parsedResponse = JSON.parse(response);
                UserInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            showUser(parsedResponse);
        }
    });
}

function showUser(userInfo: UserInfo.UserInfo) {
    getById('container').innerHTML = body;

    newUsernameInput = getById('new-username') as HTMLInputElement;
    newPasswordInput = getById('new-password') as HTMLInputElement;
    newPasswordComfirmInput = getById('new-password-confirm') as HTMLInputElement;
    inviteReceiverEmailInput = getById('receiver-email') as HTMLInputElement;

    emailChangeButton = getById('email-change-button') as HTMLButtonElement;
    usernameChangeButton = getById('username-change-button') as HTMLButtonElement;
    passwordChangeButton = getById('password-change-button') as HTMLButtonElement;
    inviteButton = getById('invite-button') as HTMLButtonElement;
    logoutButton = getById('logout-button') as HTMLButtonElement;

    addEventListener(emailChangeButton, 'click', function () {
        changeEmail();
    });
    addEventListener(usernameChangeButton, 'click', function () {
        changeUsername();
    });
    addEventListener(passwordChangeButton, 'click', function () {
        changePassword();
    });
    addEventListener(inviteButton, 'click', function () {
        invite();
    });
    addEventListener(logoutButton, 'click', function () {
        logout(function () { redirect(LOGIN_URL); });
    });

    passwordStyling(newPasswordInput);
    passwordStyling(newPasswordComfirmInput);

    appendText(getById('email'), userInfo.email);
    appendText(getById('invite-count'), userInfo.invite_quota.toString());

    newUsernameInput.value = userInfo.username;
    currentUsername = userInfo.username;

    addNavBar('my_account');
    showElement(getBody());
}

function invite() {
    disableAllInputs(true);

    const warningElem = getById('invite-warning');

    const receiver = inviteReceiverEmailInput.value;
    hideElement(warningElem);
    changeColor(warningElem, 'red');
    if (!EMAIL_REGEX.test(receiver)) {
        replaceText(warningElem, invalidEmailFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    sendServerRequest('send_invite.php', {
        callback: function (response: string) {
            if (response == 'NOT QUALIFIED') {
                replaceText(warningElem, invitationNotQualified);
            } else if (response == 'INVALID FORMAT') {
                replaceText(warningElem, invalidEmailFormat);
            } else if (response == 'ALREADY REGISTERED') {
                replaceText(warningElem, emailAlreadyRegistered);
            } else if (response == 'CLOSED') {
                replaceText(warningElem, invitationClosed);
            } else if (response == 'DONE') {
                showMessage(emailSentParam(getBaseURL()));
                return;
            } else {
                showMessage();
                return;
            }
            showElement(warningElem);
            disableAllInputs(false);
        },
        content: 'receiver=' + encodeURIComponent(receiver)
    });
}

async function changePassword() {
    disableAllInputs(true);

    const warningElem = getById('password-warning');
    let newPassword = newPasswordInput.value;
    const newPasswordConfirm = newPasswordComfirmInput.value;

    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (!PASSWORD_REGEX.test(newPassword)) {
        replaceText(warningElem, invalidPasswordFormat);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newPassword != newPasswordConfirm) {
        replaceText(warningElem, passwordConfirmationMismatch);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    newPassword = await hashPassword(newPassword);

    sendServerRequest('change_password.php', {
        callback: function (response: string) {
            if (response == 'DONE') {
                replaceText(warningElem, passwordChanged);
                showElement(warningElem);
                changeColor(warningElem, 'green');
                disableAllInputs(false);
            } else {
                showMessage();
            }
        },
        content: 'new=' + newPassword
    });
}

function changeEmail() {
    disableAllInputs(true);
    const warningElem = getById('email-warning');
    hideElement(warningElem);
    changeColor(warningElem, 'red');

    sendServerRequest('send_email_change.php', {
        callback: function (response: string) {
            if (response == 'WAIT') {
                replaceText(warningElem, emailChangeWait);
            } else if (response == 'DONE') {
                replaceText(warningElem, emailSentInline);
                changeColor(warningElem, 'green');
            } else {
                showMessage();
                return;
            }
            showElement(warningElem);
            disableAllInputs(false);
        }
    });
}

function changeUsername() {
    disableAllInputs(true);
    const warningElem = getById('username-warning');
    const newUsername = newUsernameInput.value;
    hideElement(warningElem);
    changeColor(warningElem, 'red');

    if (newUsername == '') {
        replaceText(warningElem, usernameEmpty);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    } else if (newUsername == currentUsername) {
        replaceText(warningElem, usernameUnchanged);
        showElement(warningElem);
        disableAllInputs(false);
        return;
    }

    sendServerRequest('change_username.php', {
        callback: function (response: string) {
            if (response == 'DONE') {
                replaceText(warningElem, usernameChanged);
                showElement(warningElem);
                changeColor(warningElem, 'green');
                currentUsername = newUsername;
            } else if (response == 'DUPLICATED') {
                replaceText(warningElem, usernameTaken);
                showElement(warningElem);
            } else if (response == 'EMPTY') {
                replaceText(warningElem, usernameEmpty);
                showElement(warningElem);
            } else {
                showMessage();
                return;
            }
            disableAllInputs(false);
        },
        content: 'new=' + newUsername
    });
}

function disableAllInputs(disabled: boolean) {
    disableInput(newUsernameInput, disabled);
    disableInput(newPasswordInput, disabled);
    disableInput(newPasswordComfirmInput, disabled);
    disableInput(inviteReceiverEmailInput, disabled);

    emailChangeButton.disabled = disabled;
    usernameChangeButton.disabled = disabled;
    passwordChangeButton.disabled = disabled;
    inviteButton.disabled = disabled;
    logoutButton.disabled = disabled;
}