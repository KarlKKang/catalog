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
		window.location.replace('https://featherine.com/account');
		return;
	}
	
	var currentUsername;
	
	var emailChangeButton;
	var usernameChangeButton;
	var passwordChangeButton;
	var inviteButton;
	
	appearanceSwitching();
	initialize();
	
function initialize (){
	
	sendServerRequest('get_account.php', {
		callback: function (response) {
			try {
				var userInfo = JSON.parse(response);
			} catch (e) {
				showMessage ({message: 'サーバーが無効な応答を返しました。このエラーが続く場合は、管理者にお問い合わせください。', url: topURL});
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
			'<div class="input-field"><input id="new-password" type="password" placeholder="新しいパスワード" autocapitalize="off" autocomplete="off"></div>'+
			'<div class="input-field"><input id="new-password-confirm" type="password" placeholder="確認再入力" autocapitalize="off" autocomplete="off"></div>'+
			'<button class="button" id="password-change-button">変更する</button>'+
			'<div class="note">'+
				'<ul>'+
					'<li>使用出来る文字は、半角英大文字、半角英小文字、数字、記号+_!@#$%^&amp;*.,?-です。</li>'+
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

		document.getElementById('new-password').addEventListener('input', function () {
			passwordStyling(this);
		});
		document.getElementById('new-password-confirm').addEventListener('input', function () {
			passwordStyling(this);
		});
		
		document.getElementById('email').innerHTML = userInfo.email;
		document.getElementById('invite-count').innerHTML = userInfo.invite_quota;
		if (userInfo.invite_quota == 0) {
			document.getElementById('invite-input').classList.add('hidden');
			inviteButton.classList.add('hidden');
		}
		document.getElementById('new-username').value = userInfo.username;
		currentUsername = userInfo.username;
		
		navListeners();
		document.body.classList.remove("hidden");
	}
}
	
function invite () {
	inviteButton.disabled = true;
	var receiver = document.getElementById('receiver-email').value;
	var warningElem = document.getElementById('invite-warning');
	changeColor (warningElem, 'red');
	if (receiver == '' || !/^[^\s@]+@[^\s@]+$/.test(receiver)) {
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
				warningElem.innerHTML = '現在、一般登録を受け付けています。featherine.com/special_register で登録することができます。';
				warningElem.classList.remove('hidden');
			} else if (response == 'CLOSED') {
				warningElem.innerHTML = '現在、新規登録は受け付けておりません。';
				warningElem.classList.remove('hidden');
			} else if (response == 'DONE') {
				warningElem.innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
				changeColor (warningElem, 'green');
				warningElem.classList.remove('hidden');
			} else {
				showMessage ({url: topURL});
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
	
	if (newPassword=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/.test(newPassword)) {
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
				showMessage ({url: topURL});
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
				showMessage ({url: topURL});
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
				showMessage ({url: topURL});
				return;
			}
			usernameChangeButton.disabled=false;
		},
		content: "new="+newUsername
	});
}
});