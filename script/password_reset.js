// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://login.featherine.com/password_reset') && !debug) {
		window.location.href = 'https://featherine.com';
		return 0;
	}
	document.getElementById('new-password').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			submitRequest ();
		}
	});
	document.getElementById('new-password-confirm').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			submitRequest ();
		}
	});
	document.getElementById('submit-button').addEventListener('click', function () {
		submitRequest ();
	});
	
	document.getElementById('new-password').addEventListener('input', function () {
		passwordStyling(this);
	});
	document.getElementById('new-password-confirm').addEventListener('input', function () {
		passwordStyling(this);
	});
	
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');
	var expires = getURLParam ('expires');

	if (user == null || user.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return 0;
	}
	
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = loginURL;
		return 0;
	}

	if (expires == null || expires.match(/^[0-9]+$/)===null) {
		window.location.href = loginURL;
		return 0;
	}

	handshake (function () {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (checkXHRStatus (this.status)) {
					if (this.responseText.includes('/var/www')) {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					} else if (this.responseText.includes('SERVER ERROR:')) {
						showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
					} else if (this.responseText.includes('EXPIRED')) {
						showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
					} else if (this.responseText != 'APPROVED') {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					} else {
						document.getElementsByTagName("body")[0].classList.remove("hidden");
					}
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/password_reset.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("user="+user+"&signature="+signature+"&expires="+expires);
	});


	function submitRequest () {
		document.getElementById('submit-button').disabled=true;

		var newPassword = document.getElementById('new-password').value;
		var newPasswordConfirm = document.getElementById('new-password-confirm').value;

		if (newPassword=='' || newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
			document.getElementById('warning').innerHTML = 'パスワードが要件を満たしていません。';
			document.getElementById('warning').classList.remove('hidden');
			document.getElementById('submit-button').disabled=false;
			return 0;
		} else if (newPassword!=newPasswordConfirm) {
			document.getElementById('warning').innerHTML = '確認再入力が一致しません。';
			document.getElementById('warning').classList.remove('hidden');
			document.getElementById('submit-button').disabled=false;
			return 0;
		} else {
			var hash = forge.md.sha512.sha256.create();
			hash.update(newPassword);
			newPassword = hash.digest().toHex();
		}

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (checkXHRStatus (this.status)) {
					if (this.responseText.includes('/var/www')) {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					} else if (this.responseText.includes('SERVER ERROR:')) {
						showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
					} else if (this.responseText.includes('EXPIRED')) {
						showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
					} else if (this.responseText == 'DONE') {
						showMessage ('完了しました', 'green', 'パスワードが変更されました。', loginURL);
					} else {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
					}
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/password_reset.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("user="+user+"&signature="+signature+"&expires="+expires+"&new="+newPassword);
	}
});