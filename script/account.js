// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/account.html') && !debug) {
		window.location.href = 'https://featherine.com/account.html';
	}
    start ('account');
});

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
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature));
}

function showUser (userInfo) {
	document.getElementById('email').innerHTML = user.email;
	document.getElementById('invite-count').innerHTML = userInfo.invite_quota;
	if (userInfo.invite_quota == 0) {
		document.getElementById('invite-input').style.display = 'none';
		document.getElementById('invite-button').style.display = 'none';
	}
	document.getElementById('new-username').value = userInfo.username;
}

function invite () {
	var receiver = document.getElementById('receiver-email').value;
	if (receiver == '' || receiver.match(/^[^\s@]+@[^\s@]+$/)===null) {
		document.getElementById('invite-warning').innerHTML="有効なメールアドレスを入力してください。";
		document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: red;');
		return 0;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				document.getElementById('invite-button').disabled = false;
				if (this.responseText.includes('NOT QUALIFIED')) {
					document.getElementById('invite-warning').innerHTML = '招待状を送信する資格がありません。';
					document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('INVALID FORMAT')) {
					document.getElementById('invite-warning').innerHTML = '有効なメールアドレスを入力してください。';
					document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('ALREADY REGISTERED')) {
					document.getElementById('invite-warning').innerHTML = 'このメールアドレスはすでに登録済みです。';
					document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('ONGOING')) {
					document.getElementById('invite-warning').innerHTML = '未定の招待があります。招待が完了するまでお待ちください。';
					document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('ALREADY INVITED')) {
					document.getElementById('invite-warning').innerHTML = 'このメールアドレスはすでに招待されています。';
					document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('SPECIAL')) {
					document.getElementById('invite-warning').innerHTML = '現在、一般登録を受け付けています。<span class="link" onclick="goTo(\'special_register\')">こちら</span>からご登録ください。';
					document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('CLOSED')) {
					document.getElementById('invite-warning').innerHTML = '現在、新規登録は受け付けておりません。';
					document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('DONE')) {
					document.getElementById('invite-warning').innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
					document.getElementById('invite-warning').setAttribute('style', 'display: initial; color: green;');
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					logout(false);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/send_invite.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&receiver="+encodeURIComponent(receiver));
	document.getElementById('invite-button').disabled = true;
}

function changePassword () {
	var newPassword = document.getElementById('new-password').value;
	var newPasswordConfirm = document.getElementById('new-password-confirm').value;
	
	if (newPassword=='' || newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		document.getElementById('password-warning').innerHTML="パスワードが要件を満たしていません。";
		document.getElementById('password-warning').setAttribute('style', 'display: initial; color: red;');
		return 0;
	} else if (newPassword!=newPasswordConfirm) {
		document.getElementById('password-warning').innerHTML = '確認再入力が一致しません。';
		document.getElementById('password-warning').setAttribute('style', 'display: initial; color: red;');
		return 0;
	} else {
		var hash = forge.md.sha512.sha256.create();
		hash.update(newPassword);
		newPassword = hash.digest().toHex();
	}
	
	if (newPassword == user.password) {
		document.getElementById('password-warning').innerHTML = '新しいパスワードは元のパスワードと同じです。';
		document.getElementById('password-warning').setAttribute('style', 'display: initial; color: red;');
		return 0;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				document.getElementById('password-change-button').disabled=false;
				if (this.responseText.includes('DONE')) {
					showMessage ('完了しました', 'green', 'パスワードが変更されました。もう一度ログインしてください。', loginURL);
					logout (false);
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					logout(false);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/password_change.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&new="+newPassword);
	document.getElementById('password-change-button').disabled=true;
}

function changeEmail () {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				document.getElementById('email-change-button').disabled = false;
				if (this.responseText.includes('DUPLICATED')) {
					document.getElementById('email-warning').innerHTML = '同じリクエストがまだ進行中です。 別のリクエストを提出する前にそれを完了してください。';
					document.getElementById('email-warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('DONE')) {
					document.getElementById('email-warning').innerHTML = 'メールが送信されました。届くまでに時間がかかる場合があります。';
					document.getElementById('email-warning').setAttribute('style', 'display: initial; color: green;');
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					logout(false);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/send_email_change.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature));
	document.getElementById('email-change-button').disabled = true;
}

function changeUsername () {
	var newUsername = document.getElementById('new-username').value;
	
	if (newUsername=='') {
		document.getElementById('username-warning').innerHTML="新しいユーザー名を入力してください。";
		document.getElementById('username-warning').setAttribute('style', 'display: initial;');
		return 0;
	} 
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			document.getElementById('username-change-button').disabled=false;
			if (checkXHRResponse (this)) {
				if (this.responseText.includes('DONE')) {
					document.getElementById('username-warning').innerHTML = '完了しました。';
					document.getElementById('username-warning').setAttribute('style', 'display: initial; color: green;');
				} else if (this.responseText.includes('DUPLICATED')) {
					document.getElementById('username-warning').innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
					document.getElementById('username-warning').setAttribute('style', 'display: initial; color: red;');
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
					logout(false);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/username_change.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&new="+newUsername);
	document.getElementById('username-change-button').disabled=true;
}