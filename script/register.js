// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/register.html') && !debug) {
		window.location.href = 'https://featherine.com';
	}
	
    initialize ();
	
	document.getElementById('username').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			register ();
		}
	});
	document.getElementById('password').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			register ();
		}
	});
	document.getElementById('password-confirm').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			register ();
		}
	});
});

var param = getURLParam ('p');
var signature = getURLParam ('signature');

function initialize () {
	if (param == null || param.match(/^[a-zA-Z0-9~_-]+$/)===null) {
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
				} else if (this.responseText.includes('SPECIAL')) {
					showMessage ('リクエストは拒否されました', 'red', '現在、一般登録を受け付けています。ボタンをクリックして登録ページに移動してください。', rootURL + 'special_register.html');
				} else if (this.responseText.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', this.responseText, topURL);
				} else if (this.responseText.includes('/var/www') || !this.responseText.includes('APPROVED')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/register.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+param+"&signature="+signature);
}

function register () {
	var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;
	var passwordConfirm = document.getElementById('password').value;
	
	if (username == '') {
		document.getElementById('warning').innerHTML = 'ユーザー名を入力してください。';
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	}
	
	if (password=='' || password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		document.getElementById('warning').innerHTML = 'パスワードが要件を満たしていません。';
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	} else if (password!=passwordConfirm) {
		document.getElementById('warning').innerHTML = '新しいパスワードと新しいパスワード(確認)が一致しません。';
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	} else {
		var hash = forge.md.sha512.sha256.create();
		hash.update(password);
		password = hash.digest().toHex();
	}
	
	var user = {
		username: username,
		password: password
	};
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				document.getElementById('submit-button').disabled = false;
				if (this.responseText.includes('EXPIRED')) {
				showMessage ('期限が切れています', 'red', 'もう一度やり直してください。', loginURL);
				} else if (this.responseText.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
				} else if (this.responseText.includes('USERNAME DUPLICATED')) {
					document.getElementById('warning').innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
					document.getElementById('warning').setAttribute('style', 'display: initial;');
				} else if (this.responseText.includes('/var/www')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				} else if (this.responseText.includes('DONE')) {
					showMessage ('完了しました', 'green', 'アカウントが登録されました。', loginURL);
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/register.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+param+"&signature="+signature+"&user="+encodeURIComponent(JSON.stringify(user)));
	document.getElementById('submit-button').disabled = true;
}