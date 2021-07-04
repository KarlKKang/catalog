// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/special_register.html') && !debug) {
		window.location.href = 'https://featherine.com/special_register.html';
	}
	
    start ('special_register');
	
	document.getElementById('email').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			register ();
		}
	});
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

function initialize () {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (this.responseText.includes('REJECTED')) {
					window.location.href = loginURL;
				} else if (this.responseText.includes('APPROVED')) {
					document.getElementsByTagName("body")[0].style.display = "block";
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/special_register.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("status_only=true");
}

function register () {
	var email = document.getElementById('email').value;
	var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;
	var passwordConfirm = document.getElementById('password').value;
	
	if (email == '' || email.match(/^[^\s@]+@[^\s@]+$/)===null) {
		document.getElementById('warning').innerHTML = '有効なメールアドレスを入力してください。';
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	}
	
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
		email: email,
		username: username,
		password: password
	};
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				document.getElementById('submit-button').disabled = false;
				if (this.responseText.includes('REJECTED')) {
					showMessage ('リクエストは拒否されました', 'red', '現在、このページでの新規登録は受け付けておりません。', loginURL);
				} else if (this.responseText.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
				} else if (this.responseText.includes('ALREADY REGISTERED')) {
					document.getElementById('warning').innerHTML = 'このメールアドレスはすでに登録済みです。';
					document.getElementById('warning').setAttribute('style', 'display: initial; color: red;');
				} else if (this.responseText.includes('USERNAME DUPLICATED')) {
					document.getElementById('warning').innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
					document.getElementById('warning').setAttribute('style', 'display: initial;');
				} else if (this.responseText.includes('/var/www')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				} else if (this.responseText.includes('DONE')) {
					showMessage ('送信されました', 'green', '確認メールが送信されました。届くまでに時間がかかる場合があります。', loginURL);
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/special_register.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user)));
	document.getElementById('submit-button').disabled = true;
}