// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/special_register') && !debug) {
		window.location.href = 'https://featherine.com/special_register';
		return 0;
	}
	
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
	
	document.getElementsByClassName('link')[0].addEventListener('click', function () {
		window.open ('policy');
	});
	document.getElementsByClassName('link')[1].addEventListener('click', function () {
		window.open ('policy#en');
	});
	document.getElementsByClassName('link')[2].addEventListener('click', function () {
		window.open ('policy#zh-Hant');
	});
	document.getElementsByClassName('link')[3].addEventListener('click', function () {
		window.open ('policy#zh-Hans');
	});
	
	document.getElementById('submit-button').addEventListener('click', function () {
		register ();
	});
	
	document.getElementById('password').addEventListener('input', function () {
		passwordStyling(this);
	});
	document.getElementById('password-confirm').addEventListener('input', function () {
		passwordStyling(this);
	});
	
	start ('special_register', function () {initialize ();});
	
function initialize () {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				if (this.responseText.includes('REJECTED')) {
					window.location.href = loginURL;
				} else if (this.responseText == 'APPROVED') {
					document.getElementsByTagName("body")[0].classList.remove("hidden");
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/special_register.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("status_only=true");
}
	
function register () {
	document.getElementById('submit-button').disabled = true;
	
	var email = document.getElementById('email').value;
	var username = document.getElementById('username').value;
	var password = document.getElementById('password').value;
	var passwordConfirm = document.getElementById('password').value;
	
	if (email == '' || email.match(/^[^\s@]+@[^\s@]+$/)===null) {
		document.getElementById('warning').innerHTML = '有効なメールアドレスを入力してください。';
		document.getElementById('warning').classList.remove('hidden');
		document.getElementById('submit-button').disabled = false;
		return 0;
	}
	
	if (username == '') {
		document.getElementById('warning').innerHTML = 'ユーザー名を入力してください。';
		document.getElementById('warning').classList.remove('hidden');
		document.getElementById('submit-button').disabled = false;
		return 0;
	}
	
	if (password=='' || password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		document.getElementById('warning').innerHTML = 'パスワードが要件を満たしていません。';
		document.getElementById('warning').classList.remove('hidden');
		document.getElementById('submit-button').disabled = false;
		return 0;
	} else if (password!=passwordConfirm) {
		document.getElementById('warning').innerHTML = '新しいパスワードと新しいパスワード(確認)が一致しません。';
		document.getElementById('warning').classList.remove('hidden');
		document.getElementById('submit-button').disabled = false;
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
				if (this.responseText.includes('/var/www')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				} else if (this.responseText.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', this.responseText, loginURL);
				} else if (this.responseText.includes('REJECTED')) {
					showMessage ('リクエストは拒否されました', 'red', '現在、このページでの新規登録は受け付けておりません。', loginURL);
				} else if (this.responseText.includes('ALREADY REGISTERED')) {
					document.getElementById('warning').innerHTML = 'このメールアドレスはすでに登録済みです。';
					document.getElementById('warning').classList.remove('hidden');
					document.getElementById('submit-button').disabled = false;
				} else if (this.responseText.includes('USERNAME DUPLICATED')) {
					document.getElementById('warning').innerHTML = 'このユーザー名は既に使われています。 別のユーザー名を入力してください。';
					document.getElementById('warning').classList.remove('hidden');
					document.getElementById('submit-button').disabled = false;
				} else if (this.responseText == 'DONE') {
					showMessage ('送信されました', 'green', '確認メールが送信されました。届くまでに時間がかかる場合があります。', loginURL, true);
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/special_register.php", true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user)));
}
});