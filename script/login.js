// JavaScript Document

window.addEventListener("load", function(){
	
	if (!window.location.href.startsWith('https://login.featherine.com') && !debug) {
		window.location.href = redirect ('https://login.featherine.com');
		return 0;
	}
		
	document.getElementById('username').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			login ();
		}
	});
	document.getElementById('password').addEventListener('keydown', function () {
		if (event.key === "Enter") {
			login ();
		}
	});
	
	document.getElementById('login-button').addEventListener('click', function () {
		login ();
	});
	document.getElementById('forgot-password').getElementsByTagName('span')[0].addEventListener('click', function () {
		passwordReset ();
	});
	
	document.getElementById('password').addEventListener('input', function () {
		passwordStyling(this);
	});
	
	start ('login', function () {document.getElementsByTagName("body")[0].classList.remove("hidden");});

function login () {
	document.getElementById('login-button').disabled = true;
	
	if (getCookie('allow-login')=='false') {
		document.getElementById('warning').innerHTML = 'しばらくしてからもう一度お試しください。';
		document.getElementById('warning').classList.remove('hidden');
		document.getElementById('login-button').disabled = false;
		return 0;
	}

	var email = document.getElementById('username').value;
	var password = document.getElementById('password').value;

	if (email=='' || email.match(/^[^\s@]+@[^\s@]+$/)===null) {
		document.getElementById('warning').innerHTML = 'アカウントIDかパスワードが正しくありません。';
		document.getElementById('warning').classList.remove('hidden');
		document.getElementById('login-button').disabled = false;
		return 0;
	}

	if (password=='' || password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		document.getElementById('warning').innerHTML = 'アカウントIDかパスワードが正しくありません。';
		document.getElementById('warning').classList.remove('hidden');
		document.getElementById('login-button').disabled = false;
		return 0;
	} else {
		var hash = forge.md.sha512.sha256.create();
		hash.update(password);
		password = hash.digest().toHex();
	}

	var param = {
		email: email,
		password: password,
		remember_me: document.getElementById('remember-me-checkbox').checked
	};

	param = JSON.stringify (param);

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRStatus (this.status)) {
				let response = this.responseText
				if (response.includes('/var/www')) {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}  else if (response.includes('SERVER ERROR:')) {
					showMessage ('エラーが発生しました', 'red', response, loginURL);
				} else if (response.includes('NOT SUPPORTED')) {
					document.getElementById('warning').innerHTML = 'お使いのブラウザはサポートされていません。または、IPアドレスの情報を取得できません。';
					document.getElementById('warning').classList.remove('hidden');
					document.getElementById('login-button').disabled = false;
				} else if (response.includes('AUTHENTICATION FAILED') || response.includes('NOT ACTIVATED')) {
					document.getElementById('warning').innerHTML = 'アカウントIDかパスワードが正しくありません。';
					document.getElementById('warning').classList.remove('hidden');
					document.getElementById('login-button').disabled = false;
				} else if (response.includes('REJECTED')) {
					document.getElementById('warning').innerHTML = 'しばらくしてからもう一度お試しください。';
					document.getElementById('warning').classList.remove('hidden');
					document.cookie = 'allow-login=false;max-age=86400;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
					document.getElementById('login-button').disabled = false;
				} else if (response == 'NOT RECOMMENDED') {
					setTimeout (function () {
						showMessage ('お使いのブラウザは推奨されませ', 'orange', '一部のコンテンツが正常に再生されない場合は、Safariをお使いください。', topURL);
					}, 500);
				} else if (response == 'APPROVED') {
					setTimeout (function () {
						window.location.href = redirect (topURL);
					}, 500);
				} else {
					showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', loginURL);
				}
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/login.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

function passwordReset () {
	window.location.href = 'request_password_reset'+(debug?'.html':'');
}
});