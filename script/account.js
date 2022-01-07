// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var navListeners = mainLocal.navListeners;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var topURL = mainLocal.topURL;
	var passwordStyling = mainLocal.passwordStyling;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var changeColor = mainLocal.changeColor;
	
	if (!window.location.href.startsWith('https://featherine.com/account') && !debug) {
		window.location.href = 'https://featherine.com/account';
		return;
	}
	
	var currentUsername;
	
	var emailChangeButton = document.getElementById('email-change-button');
	var usernameChangeButton = document.getElementById('username-change-button');
	var passwordChangeButton = document.getElementById('password-change-button');
	var inviteButton = document.getElementById('invite-button');
	
	appearanceSwitching();
	navListeners();
	
	initialize();
	
function initialize (){
	
	sendServerRequest('get_account.php', {
		callback: function (response) {
			try {
				var userInfo = JSON.parse(response);
			} catch (e) {
				showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', topURL);
				return;
			}
			showUser (userInfo);
		}
	});
	
	function showUser (userInfo) {
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

		document.getElementById('new-password').addEventListener('input', function () {
			passwordStyling(this);
		});
		document.getElementById('new-password-confirm').addEventListener('input', function () {
			passwordStyling(this);
		});
		
		document.body.classList.remove("hidden");
		document.getElementById('email').innerHTML = userInfo.email;
		document.getElementById('invite-count').innerHTML = userInfo.invite_quota;
		if (userInfo.invite_quota == 0) {
			document.getElementById('invite-input').classList.add('hidden');
			inviteButton.classList.add('hidden');
		}
		document.getElementById('new-username').value = userInfo.username;
		currentUsername = userInfo.username;
	}
}
	
function invite () {
	inviteButton.disabled = true;
	var receiver = document.getElementById('receiver-email').value;
	var warningElem = document.getElementById('invite-warning');
	changeColor (warningElem, 'red');
	if (receiver == '' || receiver.match(/^[^\s@]+@[^\s@]+$/)===null) {
		warningElem.innerHTML="有効なメールアドレスを入力してください。";
		warningElem.classList.remove('hidden');
		inviteButton.disabled = false;
		return;
	}
	
	sendServerRequest('send_invite.php', {
		callback: function (response) {
			if (response == 'NOT QUALIFIED') {
				warningElem.innerHTML = '招待状を送る条件を満たしていません。';
				warningElem.classList.remove('hidden');
			} else if (response == 'INVALID FORMAT') {
				warningElem.innerHTML = '有効なメールアドレスを入力してください。';
				warningElem.classList.remove('hidden');
			} else if (response == 'ALREADY REGISTERED') {
				warningElem.innerHTML = 'このメールアドレスはすでに登録済みです。';
				warningElem.classList.remove('hidden');
			} else if (response == 'ONGOING') {
				warningElem.innerHTML = '未完成の招待状があります。招待が完了するまでお待ちください。';
				warningElem.classList.remove('hidden');
			} else if (response == 'ALREADY INVITED') {
				warningElem.innerHTML = 'このメールアドレスはすでに招待されています。';
				warningElem.classList.remove('hidden');
			} else if (response == 'SPECIAL') {
				warningElem.innerHTML = '現在、一般登録を受け付けています。featherine.com/special_registerで登録することができます。';
				warningElem.classList.remove('hidden');
			} else if (response == 'CLOSED') {
				warningElem.innerHTML = '現在、新規登録は受け付けておりません。';
				warningElem.classList.remove('hidden');
			} else if (response == 'DONE') {
				warningElem.innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
				changeColor (warningElem, 'green');
				warningElem.classList.remove('hidden');
			} else {
				showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。', topURL);
				return;
			}
			inviteButton.disabled = false;
		},
		content: "receiver="+encodeURIComponent(receiver)
	});
}

function changePassword () {
	passwordChangeButton.disabled=true;
	
	var warningElem = document.getElementById('password-warning');
	var newPassword = document.getElementById('new-password').value;
	var newPasswordConfirm = document.getElementById('new-password-confirm').value;
	
	changeColor (warningElem, 'red');
	
	if (newPassword=='' || newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		warningElem.innerHTML="パスワードが要件を満たしていません。";
		warningElem.classList.remove('hidden');
		passwordChangeButton.disabled=false;
		return;
	} else if (newPassword!=newPasswordConfirm) {
		warningElem.innerHTML = '確認再入力が一致しません。';
		warningElem.classList.remove('hidden');
		passwordChangeButton.disabled=false;
		return;
	} else {
		var hash = forge.md.sha512.sha256.create();
		hash.update(newPassword);
		newPassword = hash.digest().toHex();
	}
	
	sendServerRequest('change_password.php', {
		callback: function (response) {
			if (response == 'DONE') {
				warningElem.innerHTML = '完了しました。';
				warningElem.classList.remove('hidden');
				changeColor (warningElem, 'green');
				passwordChangeButton.disabled=false;
			} else {
				showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。', topURL);
			}
		},
		content: "new="+newPassword
	});
}

function changeEmail () {
	emailChangeButton.disabled = true;
	var warningElem = document.getElementById('email-warning');
	changeColor (warningElem, 'red');
	
	sendServerRequest('send_email_change.php', {
		callback: function (response) {
			if (response == 'DUPLICATED') {
				warningElem.innerHTML = '同じリクエストがまだ進行中です。 別のリクエストを提出する前にそれを完了してください。';
				warningElem.classList.remove('hidden');
			} else if (response == 'DONE') {
				warningElem.innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
				warningElem.classList.remove('hidden');
				changeColor (warningElem, 'green');
			} else {
				showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。', topURL);
				return;
			}
			emailChangeButton.disabled = false;
		}
	});
}

function changeUsername () {
	usernameChangeButton.disabled=true;
	var warningElem = document.getElementById('username-warning');
	var newUsername = document.getElementById('new-username').value;
	changeColor (warningElem, 'red');
	
	if (newUsername=='') {
		warningElem.innerHTML="新しいユーザー名を入力してください。";
		warningElem.classList.remove('hidden');
		usernameChangeButton.disabled=false;
		return;
	} else if (newUsername == currentUsername) {
		warningElem.innerHTML = '新しいユーザー名は元のユーザー名と同じです。';
		warningElem.classList.remove('hidden');
		usernameChangeButton.disabled=false;
		return;
	} 
	
	sendServerRequest('change_username.php', {
		callback: function (response) {
			if (response == 'DONE') {
				warningElem.innerHTML = '完了しました。';
				warningElem.classList.remove('hidden');
				changeColor (warningElem, 'green');
			} else if (response == 'DUPLICATED') {
				warningElem.innerHTML = 'このユーザー名はすでに使用されています。別のユーザー名を入力してください。';
				warningElem.classList.remove('hidden');
			} else {
				showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。', topURL);
				return;
			}
			usernameChangeButton.disabled=false;
		},
		content: "new="+newUsername
	});
}
});