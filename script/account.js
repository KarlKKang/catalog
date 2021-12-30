// JavaScript Document
var currentUsername;

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/account') && !debug) {
		window.location.href = 'https://featherine.com/account';
		return 0;
	}
	
	appearanceSwitching();
	
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
				try {
					var userInfo = JSON.parse(this.responseText);
				} catch (e) {
					showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', topURL);
					return 0;
				}
				showUser (userInfo);
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
	var warningElem = document.getElementById('invite-warning');
	changeColor (warningElem, 'red');
	if (receiver == '' || receiver.match(/^[^\s@]+@[^\s@]+$/)===null) {
		warningElem.innerHTML="有効なメールアドレスを入力してください。";
		warningElem.classList.remove('hidden');
		document.getElementById('invite-button').disabled = false;
		return 0;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				if (this.responseText.includes('NOT QUALIFIED')) {
					warningElem.innerHTML = '招待状を送信する資格がありません。';
					warningElem.classList.remove('hidden');
				} else if (this.responseText.includes('INVALID FORMAT')) {
					warningElem.innerHTML = '有効なメールアドレスを入力してください。';
					warningElem.classList.remove('hidden');
				} else if (this.responseText.includes('ALREADY REGISTERED')) {
					warningElem.innerHTML = 'このメールアドレスはすでに登録済みです。';
					warningElem.classList.remove('hidden');
				} else if (this.responseText.includes('ONGOING')) {
					warningElem.innerHTML = '未定の招待があります。招待が完了するまでお待ちください。';
					warningElem.classList.remove('hidden');
				} else if (this.responseText.includes('ALREADY INVITED')) {
					warningElem.innerHTML = 'このメールアドレスはすでに招待されています。';
					warningElem.classList.remove('hidden');
				} else if (this.responseText.includes('SPECIAL')) {
					warningElem.innerHTML = '現在、一般登録を受け付けています。featherine.com/special_registerで登録することができます。';
					warningElem.classList.remove('hidden');
				} else if (this.responseText.includes('CLOSED')) {
					warningElem.innerHTML = '現在、新規登録は受け付けておりません。';
					warningElem.classList.remove('hidden');
				} else if (this.responseText == 'DONE') {
					warningElem.innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
					changeColor (warningElem, 'green');
					warningElem.classList.remove('hidden');
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
	
	var warningElem = document.getElementById('password-warning');
	var newPassword = document.getElementById('new-password').value;
	var newPasswordConfirm = document.getElementById('new-password-confirm').value;
	
	changeColor (warningElem, 'red');
	
	if (newPassword=='' || newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		warningElem.innerHTML="パスワードが要件を満たしていません。";
		warningElem.classList.remove('hidden');
		document.getElementById('password-change-button').disabled=false;
		return 0;
	} else if (newPassword!=newPasswordConfirm) {
		warningElem.innerHTML = '確認再入力が一致しません。';
		warningElem.classList.remove('hidden');
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
					warningElem.innerHTML = '完了しました。';
					warningElem.classList.remove('hidden');
					changeColor (warningElem, 'green');
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
	var warningElem = document.getElementById('email-warning');
	changeColor (warningElem, 'red');
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				if (this.responseText.includes('DUPLICATED')) {
					warningElem.innerHTML = '同じリクエストがまだ進行中です。 別のリクエストを提出する前にそれを完了してください。';
					warningElem.classList.remove('hidden');
				} else if (this.responseText == 'DONE') {
					warningElem.innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
					warningElem.classList.remove('hidden');
					changeColor (warningElem, 'green');
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
	var warningElem = document.getElementById('username-warning');
	var newUsername = document.getElementById('new-username').value;
	changeColor (warningElem, 'red');
	
	if (newUsername=='') {
		warningElem.innerHTML="新しいユーザー名を入力してください。";
		warningElem.classList.remove('hidden');
		document.getElementById('username-change-button').disabled=false;
		return 0;
	} else if (newUsername == currentUsername) {
		warningElem.innerHTML = '新しいユーザー名は元のユーザー名と同じです。';
		warningElem.classList.remove('hidden');
		document.getElementById('username-change-button').disabled=false;
		return 0;
	} 
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				if (this.responseText == 'DONE') {
					warningElem.innerHTML = '完了しました。';
					warningElem.classList.remove('hidden');
					changeColor (warningElem, 'green');
				} else if (this.responseText.includes('DUPLICATED')) {
					warningElem.innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
					warningElem.classList.remove('hidden');
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