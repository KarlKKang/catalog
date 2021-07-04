// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://login.featherine.com/password_reset.html') && !debug) {
		window.location.href = 'https://featherine.com';
	}
    initialize ();
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
});

var user = getURLParam ('user');
var signature = getURLParam ('signature');


function initialize () {
	if (user == null || user.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = topURL;
		return 0;
	}
	
	if (signature == null || signature.match(/^[a-zA-Z0-9~_-]+$/)===null) {
		window.location.href = topURL;
		return 0;
	}
	
	handshake ();
	document.getElementsByTagName("body")[0].style.display = "block";
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (this.responseText.includes('EXPIRED')) {
					showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
				} else if (this.responseText.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
				} else if (this.responseText.includes('/var/www')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				} else if (!this.responseText.includes('APPROVED')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				} 
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/password_reset.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+user+"&signature="+signature);
}

function submitRequest () {
	var newPassword = document.getElementById('new-password').value;
	var newPasswordConfirm = document.getElementById('new-password-confirm').value;
	
	if (newPassword=='' || newPassword.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		document.getElementById('warning').innerHTML = 'パスワードが要件を満たしていません。';
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	} else if (newPassword!=newPasswordConfirm) {
		document.getElementById('warning').innerHTML = '確認再入力が一致しません。';
		document.getElementById('warning').setAttribute('style', 'display: initial;');
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
				if (this.responseText.includes('EXPIRED')) {
					showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
				} else if (this.responseText.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
				} else if (this.responseText.includes('/var/www')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				} else if (this.responseText.includes('DONE')) {
					showMessage ('完了しました', 'green', 'パスワードが変更されました。', loginURL);
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/password_reset.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+user+"&signature="+signature+"&new="+newPassword);
}