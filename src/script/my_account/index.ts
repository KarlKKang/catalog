// JavaScript Document
import 'core-js';
import {
    DEVELOPMENT, TOP_URL
} from '../module/env/constant';
import {
    navListeners,
    passwordStyling,
    sendServerRequest,
    changeColor,
    clearCookies,
    hashPassword,
    disableInput,
    PASSWORD_REGEX,
    EMAIL_REGEX
} from '../module/main';
import {
    w,
    addEventListener,
    getBaseURL,
    redirect,
    getById,
    getBody,
    showElement,
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
    usernameTaken
} from '../module/message/template/inline';
import * as UserInfo from '../module/type/UserInfo';
import isbot from 'isbot';
import body from './body.html';


addEventListener(w, 'load', function () {
    if (getBaseURL() !== TOP_URL + '/my_account' && !DEVELOPMENT) {
        redirect(TOP_URL + '/my_account', true);
        return;
    }

    clearCookies();

    if (navigator !== undefined && isbot(navigator.userAgent)) {
        return;
    }

    let currentUsername: string;

    let newUsernameInput: HTMLInputElement;
    let newPasswordInput: HTMLInputElement;
    let newPasswordComfirmInput: HTMLInputElement;
    let inviteReceiverEmailInput: HTMLInputElement;

    let emailChangeButton: HTMLButtonElement;
    let usernameChangeButton: HTMLButtonElement;
    let passwordChangeButton: HTMLButtonElement;
    let inviteButton: HTMLButtonElement;

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

        passwordStyling(newPasswordInput);
        passwordStyling(newPasswordComfirmInput);

        getById('email').innerHTML = userInfo.email;
        getById('invite-count').innerHTML = userInfo.invite_quota.toString();

        newUsernameInput.value = userInfo.username;
        currentUsername = userInfo.username;

        navListeners();
        showElement(getBody());
    }

    function invite() {
        disableAllInputs(true);

        const warningElem = getById('invite-warning');

        const receiver = inviteReceiverEmailInput.value;
        changeColor(warningElem, 'red');
        if (!EMAIL_REGEX.test(receiver)) {
            warningElem.innerHTML = invalidEmailFormat;
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('send_invite.php', {
            callback: function (response: string) {
                if (response == 'NOT QUALIFIED') {
                    warningElem.innerHTML = invitationNotQualified;
                } else if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = invalidEmailFormat;
                } else if (response == 'ALREADY REGISTERED') {
                    warningElem.innerHTML = emailAlreadyRegistered;
                } else if (response == 'CLOSED') {
                    warningElem.innerHTML = invitationClosed;
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

        changeColor(warningElem, 'red');

        if (!PASSWORD_REGEX.test(newPassword)) {
            warningElem.innerHTML = invalidPasswordFormat;
            showElement(warningElem);
            disableAllInputs(false);
            return;
        } else if (newPassword != newPasswordConfirm) {
            warningElem.innerHTML = passwordConfirmationMismatch;
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        newPassword = await hashPassword(newPassword);

        sendServerRequest('change_password.php', {
            callback: function (response: string) {
                if (response == 'DONE') {
                    warningElem.innerHTML = passwordChanged;
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
        changeColor(warningElem, 'red');

        sendServerRequest('send_email_change.php', {
            callback: function (response: string) {
                if (response == 'DONE') {
                    warningElem.innerHTML = emailSentInline;
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
        changeColor(warningElem, 'red');

        if (newUsername == '') {
            warningElem.innerHTML = usernameEmpty;
            showElement(warningElem);
            disableAllInputs(false);
            return;
        } else if (newUsername == currentUsername) {
            warningElem.innerHTML = usernameUnchanged;
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('change_username.php', {
            callback: function (response: string) {
                if (response == 'DONE') {
                    warningElem.innerHTML = usernameChanged;
                    showElement(warningElem);
                    changeColor(warningElem, 'green');
                    currentUsername = newUsername;
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = usernameTaken;
                    showElement(warningElem);
                } else if (response == 'EMPTY') {
                    warningElem.innerHTML = usernameEmpty;
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
    }
});