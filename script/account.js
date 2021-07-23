// JavaScript Document
var currentUsername;

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/account') && !debug) {
		window.location.href = 'https://featherine.com/account';
		return 0;
	}
	
	document.getElementById('nav-btn').addEventListener('click', function () {
		navUpdate ();
	});
	
	document.getElementById('nav-menu-content-1').addEventListener('click', function () {
		goTo('top');
	});
	document.getElementById('nav-menu-content-2').addEventListener('click', function () {
		goTo('account');
	});
	document.getElementById('nav-menu-content-3').addEventListener('click', function () {
		goTo('info');
	});
	document.getElementById('nav-menu-content-4').addEventListener('click', function () {
		logout(function () {window.location.href = redirect (loginURL);});
	});
	
	document.getElementById('email-change-button').addEventListener('click', function () {
		changeEmail ();
	});
	document.getElementById('username-change-button').addEventListener('click', function () {
		changeUsername ();
	});
	document.getElementById('password-change-button').addEventListener('click', function () {
		changePassword ();
	});
	document.getElementById('invite-button').addEventListener('click', function () {
		invite ();
	});
	
	document.getElementById('new-password').addEventListener('input', function () {
		passwordStyling(this);
	});
	document.getElementById('new-password-confirm').addEventListener('input', function () {
		passwordStyling(this);
	});
	
	start ('account', function () {initialize();});
	
function initialize (){
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				showUser (JSON.parse(this.responseText));
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/request_user.php", true);
	xmlhttp.withCredentials = true;
	xmlhttp.send();
	
	function showUser (userInfo) {
		document.getElementsByTagName("body")[0].classList.remove("hidden");
		document.getElementById('email').innerHTML = userInfo.email;
		document.getElementById('invite-count').innerHTML = userInfo.invite_quota;
		if (userInfo.invite_quota == 0) {
			document.getElementById('invite-input').classList.add('hidden');
			document.getElementById('invite-button').classList.add('hidden');
		}
		document.getElementById('new-username').value = userInfo.username;
		currentUsername = userInfo.username;
	}
}
	
function invite () {
	document.getElementById('invite-button').disabled = true;
	var receiver = document.getElementById('receiver-email').value;
	if (receiver == '' || receiver.match(/^[^\s@]+@[^\s@]+$/)===null) {
		document.getElementById('invite-warning').innerHTML="有効なメールアドレスを入力してください。";
		document.getElementById('invite-warning').classList.remove('hidden');
		document.getElementById('invite-warning').classList.add('color-red');
		document.getElementById('invite-button').disabled = false;
		return 0;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				if (this.responseText.includes('NOT QUALIFIED')) {
					document.getElementById('invite-warning').innerHTML = '招待状を送信する資格がありません。';
					document.getElementById('invite-warning').classList.remove('hidden');
					document.getElementById('invite-warning').classList.add('color-red');
				} else if (this.responseText.includes('INVALID FORMAT')) {
					document.getElementById('invite-warning').innerHTML = '有効なメールアドレスを入力してください。';
					document.getElementById('invite-warning').classList.remove('hidden');
					document.getElementById('invite-warning').classList.add('color-red');
				} else if (this.responseText.includes('ALREADY REGISTERED')) {
					document.getElementById('invite-warning').innerHTML = 'このメールアドレスはすでに登録済みです。';
					document.getElementById('invite-warning').classList.remove('hidden');
					document.getElementById('invite-warning').classList.add('color-red');
				} else if (this.responseText.includes('ONGOING')) {
					document.getElementById('invite-warning').innerHTML = '未定の招待があります。招待が完了するまでお待ちください。';
					document.getElementById('invite-warning').classList.remove('hidden');
					document.getElementById('invite-warning').classList.add('color-red');
				} else if (this.responseText.includes('ALREADY INVITED')) {
					document.getElementById('invite-warning').innerHTML = 'このメールアドレスはすでに招待されています。';
					document.getElementById('invite-warning').classList.remove('hidden');
					document.getElementById('invite-warning').classList.add('color-red');
				} else if (this.responseText.includes('SPECIAL')) {
					document.getElementById('invite-warning').innerHTML = '現在、一般登録を受け付けています。featherine.com/special_registerで登録することができます。';
					document.getElementById('invite-warning').classList.remove('hidden');
					document.getElementById('invite-warning').classList.add('color-red');
				} else if (this.responseText.includes('CLOSED')) {
					document.getElementById('invite-warning').innerHTML = '現在、新規登録は受け付けておりません。';
					document.getElementById('invite-warning').classList.remove('hidden');
					document.getElementById('invite-warning').classList.add('color-red');
				} else if (this.responseText == 'DONE') {
					document.getElementById('invite-warning').innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
					document.getElementById('invite-warning').classList.remove('hidden');
					document.getElementById('invite-warning').classList.add('color-green');
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					return 0;
				}
				document.getElementById('invite-button').disabled = false;
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/send_invite.php", true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("receiver="+encodeURIComponent(receiver));
}

function changePassword () {
	document.getElementById('password-change-button').disabled=true;
	var newPassword = document.getElementById('new-password').value;
	var newPasswordConfirm = document.getElementById('new-password-confirm').value;
	
	if (newPassword=='' || newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		document.getElementById('password-warning').innerHTML="パスワードが要件を満たしていません。";
		document.getElementById('password-warning').classList.remove('hidden');
		document.getElementById('password-warning').classList.add('color-red');
		document.getElementById('password-change-button').disabled=false;
		return 0;
	} else if (newPassword!=newPasswordConfirm) {
		document.getElementById('password-warning').innerHTML = '確認再入力が一致しません。';
		document.getElementById('password-warning').classList.remove('hidden');
		document.getElementById('password-warning').classList.add('color-red');
		document.getElementById('password-change-button').disabled=false;
		return 0;
	} else {
		var hash = forge.md.sha512.sha256.create();
		hash.update(newPassword);
		newPassword = hash.digest().toHex();
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				if (this.responseText == 'DONE') {
					document.getElementById('password-warning').innerHTML = '完了しました。';
					document.getElementById('password-warning').classList.remove('hidden');
					document.getElementById('password-warning').classList.add('color-green');
					document.getElementById('password-change-button').disabled=false;
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/password_change.php", true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("new="+newPassword);
}

function changeEmail () {
	document.getElementById('email-change-button').disabled = true;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				if (this.responseText.includes('DUPLICATED')) {
					document.getElementById('email-warning').innerHTML = '同じリクエストがまだ進行中です。 別のリクエストを提出する前にそれを完了してください。';
					document.getElementById('email-warning').classList.remove('hidden');
					document.getElementById('email-warning').classList.add('color-red');
				} else if (this.responseText == 'DONE') {
					document.getElementById('email-warning').innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
					document.getElementById('email-warning').classList.remove('hidden');
					document.getElementById('email-warning').classList.add('color-green');
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					return 0;
				}
				document.getElementById('email-change-button').disabled = false;
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/send_email_change.php", true);
	xmlhttp.withCredentials = true;
	xmlhttp.send();
}

function changeUsername () {
	document.getElementById('username-change-button').disabled=true;
	var newUsername = document.getElementById('new-username').value;
	
	if (newUsername=='') {
		document.getElementById('username-warning').innerHTML="新しいユーザー名を入力してください。";
		document.getElementById('username-warning').classList.remove('hidden');
		document.getElementById('username-warning').classList.add('color-red');
		document.getElementById('username-change-button').disabled=false;
		return 0;
	} else if (newUsername == currentUsername) {
		document.getElementById('username-warning').innerHTML = '新しいユーザー名は元のユーザー名と同じです。';
		document.getElementById('username-warning').classList.remove('hidden');
		document.getElementById('username-warning').classList.add('color-red');
		document.getElementById('username-change-button').disabled=false;
		return 0;
	} 
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				if (this.responseText == 'DONE') {
					document.getElementById('username-warning').innerHTML = '完了しました。';
					document.getElementById('username-warning').classList.remove('hidden');
					document.getElementById('username-warning').classList.add('color-green');
				} else if (this.responseText.includes('DUPLICATED')) {
					document.getElementById('username-warning').innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
					document.getElementById('username-warning').classList.remove('hidden');
					document.getElementById('username-warning').classList.add('color-red');
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					return 0;
				}
				document.getElementById('username-change-button').disabled=false;
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/username_change.php", true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("new="+newUsername);
}
});