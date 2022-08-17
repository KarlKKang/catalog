// JavaScript Document
import "core-js";
import {
    DEVELOPMENT
} from './module/env/constant';
import {
    navListeners,
    passwordStyling,
    sendServerRequest,
    changeColor,
    clearCookies,
    cssVarWrapper,
    hashPassword,
    disableInput
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    addClass,
    removeClass,
    getBody,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';
import { 
    invitationNotQualified, 
    invalidEmailFormat, 
    emailAlreadyRegistered, 
    incompletedInvitation, 
    incompletedEmailChange, 
    emailAlreadyInvited, 
    invitationClosed, 
    emailSent, 
    invalidPasswordFormat, 
    passwordConfirmationMismatch, 
    passwordChanged, 
    usernameEmpty, 
    usernameUnchanged, 
    usernameChanged, 
    usernameTaken 
} from './module/message/template/inline';
import { UserInfo } from './module/type';

addEventListener(w, 'load', function () {

    cssVarWrapper();
    clearCookies();

    if (getHref() != 'https://featherine.com/my_account' && !DEVELOPMENT) {
        redirect('https://featherine.com/my_account', true);
        return;
    }

    var currentUsername: string;
    var inviteCount: number;

    var newUsernameInput: HTMLInputElement;
    var newPasswordInput: HTMLInputElement;
    var newPasswordComfirmInput: HTMLInputElement;
    var inviteReceiverEmailInput: HTMLInputElement;

    var emailChangeButton: HTMLButtonElement;
    var usernameChangeButton: HTMLButtonElement;
    var passwordChangeButton: HTMLButtonElement;
    var inviteButton: HTMLButtonElement;

    sendServerRequest('get_account.php', {
        callback: function (response: string) {
            var parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                UserInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            showUser(parsedResponse as UserInfo.UserInfo);
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
            '<div class="input-field"><input id="new-username" class="multi-language" type="text" placeholder="ユーザー名" autocapitalize="off" autocomplete="off"></div>' +
            '<button class="button" id="username-change-button">変更する</button>' +

            '<hr>' +

            '<p class="sub-title">パスワード</p>' +
            '<p class="warning hidden" id="password-warning"></p>' +
            '<div class="input-field"><input id="new-password" type="password" autocomplete="new-password" placeholder="新しいパスワード" autocapitalize="off"></div>' +
            '<div class="input-field"><input id="new-password-confirm" type="password" autocomplete="new-password" placeholder="確認再入力" autocapitalize="off"></div>' +
            '<button class="button" id="password-change-button">変更する</button>' +
            '<div class="note">' +
            '<ul>' +
            '<li>使用出来る文字は、半角数字・半角英字・記号 ` ~ ! @ # $ % ^ &amp; * ( ) - = _ + [ ] { } \\ | ; : &apos; &quot; , . &lt; &gt; / ? です。</li>' +
            '<li>8文字以上で入力して下さい。</li>' +
            '<li>大文字、小文字、数字を含める必要があります。</li>' +
            '</ul>' +
            '</div>' +

            '<hr>' +

            '<p class="sub-title">ご招待</p>' +
            '<p id="invite-count-text">送信できる招待状の数：<span id="invite-count"></span></p>' +
            '<p class="warning hidden" id="invite-warning"></p>' +
            '<div class="input-field" id="invite-input"><input id="receiver-email" type="email" placeholder="メールアドレス" autocapitalize="off" autocomplete="off"></div>' +
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
        inviteCount = userInfo.invite_quota;
        if (userInfo.invite_quota == 0) {
            addClass(getById('invite-input'), 'hidden');
            addClass(inviteButton, 'hidden');
        }
        newUsernameInput.value = userInfo.username;
        currentUsername = userInfo.username;

        navListeners();
        removeClass(getBody(), "hidden");
    }

    function invite() {
        disableAllInputs(true);

        var warningElem = getById('invite-warning');

        if (inviteCount === 0) {
            warningElem.innerHTML = invitationNotQualified;
            removeClass(warningElem, 'hidden');
            disableAllInputs(false);
            return;
        }

        var receiver = inviteReceiverEmailInput.value;
        changeColor(warningElem, 'red');
        if (receiver == '' || !/^[^\s@]+@[^\s@]+$/.test(receiver)) {
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
                } else if (response == 'ONGOING') {
                    warningElem.innerHTML = incompletedInvitation;
                } else if (response == 'ONGOING EMAIL CHANGE') {
                    warningElem.innerHTML = incompletedEmailChange;
                } else if (response == 'ALREADY INVITED') {
                    warningElem.innerHTML = emailAlreadyInvited;
                } else if (response == 'CLOSED') {
                    warningElem.innerHTML = invitationClosed;
                } else if (response == 'DONE') {
                    inviteCount--;
                    getById('invite-count').innerHTML = inviteCount.toString();
                    warningElem.innerHTML = emailSent;
                    changeColor(warningElem, 'green');
                } else {
                    showMessage();
                    return;
                }
                removeClass(warningElem, 'hidden');
                disableAllInputs(false);
            },
            content: "receiver=" + encodeURIComponent(receiver)
        });
    }

    async function changePassword() {
        disableAllInputs(true);

        var warningElem = getById('password-warning');
        var newPassword = newPasswordInput.value;
        var newPasswordConfirm = newPasswordComfirmInput.value;

        changeColor(warningElem, 'red');

        if (newPassword == '' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(newPassword)) {
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
            content: "new=" + newPassword
        });
    }

    function changeEmail() {
        disableAllInputs(true);
        var warningElem = getById('email-warning');
        changeColor(warningElem, 'red');

        sendServerRequest('send_email_change.php', {
            callback: function (response: string) {
                if (response == 'DUPLICATED') {
                    warningElem.innerHTML = incompletedEmailChange;
                } else if (response == 'REJECTED') {
                    warningElem.innerHTML = incompletedInvitation;
                } else if (response == 'DONE') {
                    warningElem.innerHTML = emailSent;
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
        var warningElem = getById('username-warning');
        var newUsername = newUsernameInput.value;
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
                } else {
                    showMessage();
                    return;
                }
                disableAllInputs(false);
            },
            content: "new=" + newUsername
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