// JavaScript Document
import 'core-js';
import {
    DEVELOPMENT, TOP_URL
} from './module/env/constant';
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
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    removeClass,
    getBody,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { emailSent as emailSentParam } from './module/message/template/param';
import { invalidResponse } from './module/message/template/param/server';
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
} from './module/message/template/inline';
import * as UserInfo from './module/type/UserInfo';
import isbot from 'isbot';

addEventListener(w, 'load', function () {
    if (getHref() !== TOP_URL + '/my_account' && !DEVELOPMENT) {
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
        getById('container').innerHTML = '<p id="title">マイページ</p>' +

            '<p class="sub-title">メールアドレス</p>' +
            '<p class="warning hidden" id="email-warning"></p>' +
            '<p id="email"></p>' +
            '<button class="button" id="email-change-button">変更する</button>' +

            '<hr>' +

            '<p class="sub-title">ユーザー名</p>' +
            '<p class="warning hidden" id="username-warning"></p>' +
            '<div class="input-field"><input id="new-username" class="multi-language" type="text" placeholder="ユーザー名" autocapitalize="off" autocomplete="off" maxlength="16"></div>' +
            '<button class="button" id="username-change-button">変更する</button>' +
            '<div class="note">' +
            '<ul>' +
            '<li>ユーザー名は16文字以内で入力して下さい。</li>' +
            '</ul>' +
            '</div>' +

            '<hr>' +

            '<p class="sub-title">パスワード</p>' +
            '<p class="warning hidden" id="password-warning"></p>' +
            '<div class="input-field"><input id="new-password" type="password" autocomplete="new-password" placeholder="新しいパスワード" autocapitalize="off"></div>' +
            '<div class="input-field"><input id="new-password-confirm" type="password" autocomplete="new-password" placeholder="確認再入力" autocapitalize="off"></div>' +
            '<button class="button" id="password-change-button">変更する</button>' +
            '<div class="note">' +
            '<ul>' +
            '<li>使用できる文字は、半角数字・半角英字・記号 ` ~ ! @ # $ % ^ &amp; * ( ) - = _ + [ ] { } \\ | ; : &apos; &quot; , . &lt; &gt; / ? です。</li>' +
            '<li>8～64文字で入力して下さい。</li>' +
            '<li>大文字、小文字、数字を含める必要があります。</li>' +
            '</ul>' +
            '</div>' +

            '<hr>' +

            '<p class="sub-title">ご招待</p>' +
            '<p id="invite-count-text">送信できる招待状の数：<span id="invite-count"></span></p>' +
            '<p class="warning hidden" id="invite-warning"></p>' +
            '<div class="input-field" id="invite-input"><input id="receiver-email" type="email" placeholder="メールアドレス" autocapitalize="off" autocomplete="off" maxlength="254"></div>' +
            '<button class="button" id="invite-button">送信する</button>' +
            '<div class="note">' +
            '<ul>' +
            '<li>進行中の招待がある場合は、別の招待状を送ることはできません。</li>' +
            '</ul>' +
            '</div>';

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
        removeClass(getBody(), 'hidden');
    }

    function invite() {
        disableAllInputs(true);

        const warningElem = getById('invite-warning');

        const receiver = inviteReceiverEmailInput.value;
        changeColor(warningElem, 'red');
        if (!EMAIL_REGEX.test(receiver)) {
            warningElem.innerHTML = invalidEmailFormat;
            removeClass(warningElem, 'hidden');
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
                    showMessage(emailSentParam(getHref()));
                    return;
                } else {
                    showMessage();
                    return;
                }
                removeClass(warningElem, 'hidden');
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
            removeClass(warningElem, 'hidden');
            disableAllInputs(false);
            return;
        } else if (newPassword != newPasswordConfirm) {
            warningElem.innerHTML = passwordConfirmationMismatch;
            removeClass(warningElem, 'hidden');
            disableAllInputs(false);
            return;
        }

        newPassword = await hashPassword(newPassword);

        sendServerRequest('change_password.php', {
            callback: function (response: string) {
                if (response == 'DONE') {
                    warningElem.innerHTML = passwordChanged;
                    removeClass(warningElem, 'hidden');
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
                removeClass(warningElem, 'hidden');
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
            removeClass(warningElem, 'hidden');
            disableAllInputs(false);
            return;
        } else if (newUsername == currentUsername) {
            warningElem.innerHTML = usernameUnchanged;
            removeClass(warningElem, 'hidden');
            disableAllInputs(false);
            return;
        }

        sendServerRequest('change_username.php', {
            callback: function (response: string) {
                if (response == 'DONE') {
                    warningElem.innerHTML = usernameChanged;
                    removeClass(warningElem, 'hidden');
                    changeColor(warningElem, 'green');
                    currentUsername = newUsername
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = usernameTaken;
                    removeClass(warningElem, 'hidden');
                } else if (response == 'EMPTY') {
                    warningElem.innerHTML = usernameEmpty;
                    removeClass(warningElem, 'hidden');
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