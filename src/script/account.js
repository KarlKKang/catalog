// JavaScript Document
import "core-js";
import {
	debug, 
	navListeners, 
	passwordStyling,
	sendServerRequest,
	message,
	changeColor,
	clearCookies,
	cssVarWrapper,
	hashPassword,
	getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){

	cssVarWrapper(cssVars);
	clearCookies();
	
	if (getHref() != 'https://featherine.com/account' && !debug) {
		window.location.replace('https://featherine.com/account');
		return;
	}
	
	var currentUsername;
	
	var newUsernameInput;
	var newPasswordInput;
	var newPasswordComfirmInput;
	var inviteReceiverEmailInput;
	
	var emailChangeButton;
	var usernameChangeButton;
	var passwordChangeButton;
	var inviteButton;
	
	initialize();
	
function initialize (){
	
	sendServerRequest('get_account.php', {
		callback: function (response) {
			var userInfo;
			try {
				userInfo = JSON.parse(response);
			} catch (e) {
				message.show (message.template.param.server.invalidResponse);
				return;
			}
			showUser (userInfo);
		}
	});
	
	function showUser (userInfo) {
		document.getElementById('container').innerHTML = '<p id="title">マイページ</p>'+

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
		
		newUsernameInput = document.getElementById('new-username');
		newPasswordInput = document.getElementById('new-password');
		newPasswordComfirmInput = document.getElementById('new-password-confirm');
		inviteReceiverEmailInput = document.getElementById('receiver-email');
		
		emailChangeButton = document.getElementById('email-change-button');
		usernameChangeButton = document.getElementById('username-change-button');
		passwordChangeButton = document.getElementById('password-change-button');
		inviteButton = document.getElementById('invite-button');
		
		emailChangeButton.addEventListener('click', function () {
			changeEmail ();
		});
		usernameChangeButton.addEventListener('click', function () {
			changeUsername ();
		});
		passwordChangeButton.addEventListener('click', function () {
			changePassword ();
		});
		inviteButton.addEventListener('click', function () {
			invite ();
		});

		newPasswordInput.addEventListener('input', function () {
			passwordStyling(this);
		});
		newPasswordComfirmInput.addEventListener('input', function () {
			passwordStyling(this);
		});
		
		document.getElementById('email').innerHTML = userInfo.email;
		document.getElementById('invite-count').innerHTML = userInfo.invite_quota;
		if (userInfo.invite_quota == 0) {
			document.getElementById('invite-input').classList.add('hidden');
			inviteButton.classList.add('hidden');
		}
		newUsernameInput.value = userInfo.username;
		currentUsername = userInfo.username;
		
		navListeners();
		document.body.classList.remove("hidden");
	}
}
	
function invite () {
	disableAllInputs(true);
	var receiver = inviteReceiverEmailInput.value;
	var warningElem = document.getElementById('invite-warning');
	changeColor (warningElem, 'red');
	if (receiver == '' || !/^[^\s@]+@[^\s@]+$/.test(receiver)) {
		warningElem.innerHTML=message.template.inline.invalidEmailFormat;
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	}
	
	sendServerRequest('send_invite.php', {
		callback: function (response) {
			if (response == 'NOT QUALIFIED') {
				warningElem.innerHTML = message.template.inline.invitationNotQualified;
				warningElem.classList.remove('hidden');
			} else if (response == 'INVALID FORMAT') {
				warningElem.innerHTML = message.template.inline.invalidEmailFormat;
				warningElem.classList.remove('hidden');
			} else if (response == 'ALREADY REGISTERED') {
				warningElem.innerHTML = message.template.inline.emailAlreadyRegistered;
				warningElem.classList.remove('hidden');
			} else if (response == 'ONGOING') {
				warningElem.innerHTML = message.template.inline.incompletedInvitation;
				warningElem.classList.remove('hidden');
			} else if (response == 'ALREADY INVITED') {
				warningElem.innerHTML = message.template.inline.emailAlreadyInvited;
				warningElem.classList.remove('hidden');
			} else if (response == 'SPECIAL') {
				warningElem.innerHTML = message.template.inline.specialRegistrationOnly;
				warningElem.classList.remove('hidden');
			} else if (response == 'CLOSED') {
				warningElem.innerHTML = message.template.inline.invitationClosed;
				warningElem.classList.remove('hidden');
			} else if (response == 'DONE') {
				warningElem.innerHTML = message.template.inline.emailSent;
				changeColor (warningElem, 'green');
				warningElem.classList.remove('hidden');
			} else {
				message.show();
				return;
			}
			disableAllInputs(false);
		},
		content: "receiver="+encodeURIComponent(receiver)
	});
}

async function changePassword () {
	disableAllInputs(true);
	
	var warningElem = document.getElementById('password-warning');
	var newPassword = newPasswordInput.value;
	var newPasswordConfirm = newPasswordComfirmInput.value;
	
	changeColor (warningElem, 'red');
	
	if (newPassword=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(newPassword)) {
		warningElem.innerHTML=message.template.inline.invalidPasswordFormat;
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	} else if (newPassword!=newPasswordConfirm) {
		warningElem.innerHTML = message.template.inline.passwordConfirmationMismatch;
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	}

	newPassword = await hashPassword(newPassword);
	
	sendServerRequest('change_password.php', {
		callback: function (response) {
			if (response == 'DONE') {
				warningElem.innerHTML = message.template.inline.passwordChanged;
				warningElem.classList.remove('hidden');
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
	var warningElem = document.getElementById('email-warning');
	changeColor (warningElem, 'red');
	
	sendServerRequest('send_email_change.php', {
		callback: function (response) {
			if (response == 'DUPLICATED') {
				warningElem.innerHTML = message.template.inline.duplicatedRequest;
				warningElem.classList.remove('hidden');
			} else if (response == 'DONE') {
				warningElem.innerHTML = message.template.inline.emailSent;
				warningElem.classList.remove('hidden');
				changeColor (warningElem, 'green');
			} else {
				message.show();
				return;
			}
			disableAllInputs(false);
		}
	});
}

function changeUsername () {
	disableAllInputs(true);
	var warningElem = document.getElementById('username-warning');
	var newUsername = newUsernameInput.value;
	changeColor (warningElem, 'red');
	
	if (newUsername=='') {
		warningElem.innerHTML=message.template.inline.usernameEmpty;
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	} else if (newUsername == currentUsername) {
		warningElem.innerHTML = message.template.inline.usernameUnchanged;
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	} 
	
	sendServerRequest('change_username.php', {
		callback: function (response) {
			if (response == 'DONE') {
				warningElem.innerHTML = message.template.inline.usernameChanged;
				warningElem.classList.remove('hidden');
				changeColor (warningElem, 'green');
				currentUsername = newUsername
			} else if (response == 'DUPLICATED') {
				warningElem.innerHTML = message.template.inline.usernameTaken;
				warningElem.classList.remove('hidden');
			} else {
				message.show();
				return;
			}
			disableAllInputs(false);
		},
		content: "new="+newUsername
	});
}
	
function disableAllInputs(disabled) {
	newUsernameInput.disabled = disabled;
	newPasswordInput.disabled = disabled;
	newPasswordComfirmInput.disabled = disabled;
	inviteReceiverEmailInput.disabled = disabled;
		
	emailChangeButton.disabled = disabled;
	usernameChangeButton.disabled = disabled;
	passwordChangeButton.disabled = disabled;
	inviteButton.disabled = disabled;
}
});