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
import * as message from './module/message';
import {UserInfo} from './module/type';

addEventListener(w, 'load', function(){

	cssVarWrapper();
	clearCookies();
	
	if (getHref() != 'https://featherine.com/account' && !DEVELOPMENT) {
		redirect('https://featherine.com/account', true);
		return;
	}
	
	var currentUsername: string;
	
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
				message.show(message.template.param.server.invalidResponse);
				return;
			}
			showUser(parsedResponse as UserInfo.UserInfo);
		}
	});
	
	function showUser (userInfo: UserInfo.UserInfo) {
		getById('container').innerHTML = '<p id="title">マイページ</p>'+

			'<p class="sub-title">メールアドレス</p>'+
			'<p class="warning hidden" id="email-warning"></p>'+
			'<p id="email"></p>'+
			'<button class="button" id="email-change-button">変更する</button>'+

			'<hr>'+

			'<p class="sub-title">ユーザー名</p>'+
			'<p class="warning hidden" id="username-warning"></p>'+
			'<div class="input-field"><input id="new-username" class="multi-language" type="text" placeholder="ユーザー名" autocapitalize="off" autocomplete="off"></div>'+
			'<button class="button" id="username-change-button">変更する</button>'+
			'<div class="note">'+
				'<ul>'+
					'<li>現在、ユーザー名は使用されていません。 新しい機能が実装されたときに使用できるように準備されています。</li>'+
				'</ul>'+
			'</div>'+

			'<hr>'+

			'<p class="sub-title">パスワード</p>'+
			'<p class="warning hidden" id="password-warning"></p>'+
			'<div class="input-field"><input id="new-password" type="password" autocomplete="new-password" placeholder="新しいパスワード" autocapitalize="off"></div>'+
			'<div class="input-field"><input id="new-password-confirm" type="password" autocomplete="new-password" placeholder="確認再入力" autocapitalize="off"></div>'+
			'<button class="button" id="password-change-button">変更する</button>'+
			'<div class="note">'+
				'<ul>'+
					'<li>使用出来る文字は、半角英大文字、半角英小文字、数字、記号 ` ~ ! @ # $ % ^ &amp; * ( ) - = _ + [ ] { } \ | ; : &apos; &quot; , . &lt; &gt; / ? です。</li>'+
					'<li>8文字以上を含めてください 。</li>'+
					'<li>大文字、小文字、数字を含めてください。</li>'+
				'</ul>'+
			'</div>'+

			'<hr>'+

			'<p class="sub-title">ご招待</p>'+
			'<p id="invite-count-text">送信できる招待状の数：<span id="invite-count"></span></p>'+
			'<p class="warning hidden" id="invite-warning"></p>'+
			'<div class="input-field" id="invite-input"><input id="receiver-email" type="email" placeholder="メールアドレス" autocapitalize="off" autocomplete="off"></div>'+
			'<button class="button" id="invite-button">送信する</button>'+
			'<div class="note">'+
				'<ul>'+
					'<li>受け入れなかった招待を含めて、1年に最大5人までしか招待できません。</li>'+
					'<li>未定の招待がある場合、これ以上招待を送信することはできません。 </li>'+
				'</ul>'+
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
			changeEmail ();
		});
		addEventListener(usernameChangeButton, 'click', function () {
			changeUsername ();
		});
		addEventListener(passwordChangeButton, 'click', function () {
			changePassword ();
		});
		addEventListener(inviteButton, 'click', function () {
			invite ();
		});

		passwordStyling(newPasswordInput);
		passwordStyling(newPasswordComfirmInput);
		
		getById('email').innerHTML = userInfo.email;
		getById('invite-count').innerHTML = userInfo.invite_quota.toString();
		if (userInfo.invite_quota == 0) {
			addClass(getById('invite-input'), 'hidden');
			addClass(inviteButton, 'hidden');
		}
		newUsernameInput.value = userInfo.username;
		currentUsername = userInfo.username;
		
		navListeners();
		removeClass(getBody(), "hidden");
	}
	
	function invite () {
		disableAllInputs(true);
		var receiver = inviteReceiverEmailInput.value;
		var warningElem = getById('invite-warning');
		changeColor (warningElem, 'red');
		if (receiver == '' || !/^[^\s@]+@[^\s@]+$/.test(receiver)) {
			warningElem.innerHTML=message.template.inline.invalidEmailFormat;
			removeClass(warningElem, 'hidden');
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('send_invite.php', {
			callback: function (response: string) {
				if (response == 'NOT QUALIFIED') {
					warningElem.innerHTML = message.template.inline.invitationNotQualified;
				} else if (response == 'INVALID FORMAT') {
					warningElem.innerHTML = message.template.inline.invalidEmailFormat;
				} else if (response == 'ALREADY REGISTERED') {
					warningElem.innerHTML = message.template.inline.emailAlreadyRegistered;
				} else if (response == 'ONGOING') {
					warningElem.innerHTML = message.template.inline.incompletedInvitation;
				} else if (response == 'ONGOING EMAIL CHANGE') {
					warningElem.innerHTML = message.template.inline.incompletedEmailChange;
				} else if (response == 'ALREADY INVITED') {
					warningElem.innerHTML = message.template.inline.emailAlreadyInvited;
				} else if (response == 'CLOSED') {
					warningElem.innerHTML = message.template.inline.invitationClosed;
				} else if (response == 'DONE') {
					warningElem.innerHTML = message.template.inline.emailSent;
					changeColor (warningElem, 'green');
				} else {
					message.show();
					return;
				}
				removeClass(warningElem, 'hidden');
				disableAllInputs(false);
			},
			content: "receiver="+encodeURIComponent(receiver)
		});
	}

	async function changePassword () {
		disableAllInputs(true);
		
		var warningElem = getById('password-warning');
		var newPassword = newPasswordInput.value;
		var newPasswordConfirm = newPasswordComfirmInput.value;
		
		changeColor (warningElem, 'red');
		
		if (newPassword=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(newPassword)) {
			warningElem.innerHTML=message.template.inline.invalidPasswordFormat;
			removeClass(warningElem, 'hidden');
			disableAllInputs(false);
			return;
		} else if (newPassword!=newPasswordConfirm) {
			warningElem.innerHTML = message.template.inline.passwordConfirmationMismatch;
			removeClass(warningElem, 'hidden');
			disableAllInputs(false);
			return;
		}

		newPassword = await hashPassword(newPassword);
		
		sendServerRequest('change_password.php', {
			callback: function (response: string) {
				if (response == 'DONE') {
					warningElem.innerHTML = message.template.inline.passwordChanged;
					removeClass(warningElem, 'hidden');
					changeColor (warningElem, 'green');
					disableAllInputs(false);
				} else {
					message.show();
				}
			},
			content: "new="+newPassword
		});
	}

	function changeEmail () {
		disableAllInputs(true);
		var warningElem = getById('email-warning');
		changeColor (warningElem, 'red');
		
		sendServerRequest('send_email_change.php', {
			callback: function (response: string) {
				if (response == 'DUPLICATED') {
					warningElem.innerHTML = message.template.inline.incompletedEmailChange;
				} else if (response == 'REJECTED') {
					warningElem.innerHTML = message.template.inline.incompletedInvitation;
				} else if (response == 'DONE') {
					warningElem.innerHTML = message.template.inline.emailSent;
					changeColor (warningElem, 'green');
				} else {
					message.show();
					return;
				}
				removeClass(warningElem, 'hidden');
				disableAllInputs(false);
			}
		});
	}

	function changeUsername () {
		disableAllInputs(true);
		var warningElem = getById('username-warning');
		var newUsername = newUsernameInput.value;
		changeColor (warningElem, 'red');
		
		if (newUsername=='') {
			warningElem.innerHTML=message.template.inline.usernameEmpty;
			removeClass(warningElem, 'hidden');
			disableAllInputs(false);
			return;
		} else if (newUsername == currentUsername) {
			warningElem.innerHTML = message.template.inline.usernameUnchanged;
			removeClass(warningElem, 'hidden');
			disableAllInputs(false);
			return;
		} 
		
		sendServerRequest('change_username.php', {
			callback: function (response: string) {
				if (response == 'DONE') {
					warningElem.innerHTML = message.template.inline.usernameChanged;
					removeClass(warningElem, 'hidden');
					changeColor (warningElem, 'green');
					currentUsername = newUsername
				} else if (response == 'DUPLICATED') {
					warningElem.innerHTML = message.template.inline.usernameTaken;
					removeClass(warningElem, 'hidden');
				} else {
					message.show();
					return;
				}
				disableAllInputs(false);
			},
			content: "new="+newUsername
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