// JavaScript Document

window.addEventListener("load", function(){
	
	if (!window.location.href.startsWith('https://login.featherine.com') && !debug) {
		window.location.href = redirect ('https://login.featherine.com');
	}
	
    start ('login');
		
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
});

function login () {
	
	if (getCookie('allow-login')=='false') {
		document.getElementById('warning').innerHTML = 'しばらくしてからもう一度お試しください。';
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	}

	var email = document.getElementById('username').value;
	var password = document.getElementById('password').value;

	if (email=='' || email.match(/^[^\s@]+@[^\s@]+$/)===null) {
		document.getElementById('warning').setAttribute('style', 'display: initial;');
		return 0;
	}

	if (password=='' || password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		document.getElementById('warning').setAttribute('style', 'display: initial;');
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
				document.getElementById('login-button').disabled = false;
				checkLogin (this.responseText);
			}
		}
	};
	xmlhttp.open("POST", serverURL + "/login.php",true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
	document.getElementById('login-button').disabled = true;

	function checkLogin (token) {
		if (token.includes('AUTHENTICATION FAILED') || token.includes('NOT ACTIVATED')) {
			document.getElementById('warning').innerHTML = 'アカウントIDかパスワードが正しくありません。';
			document.getElementById('warning').setAttribute('style', 'display: initial;');
			return 0;
		} else if (token.includes('REJECTED')) {
			document.getElementById('warning').innerHTML = 'しばらくしてからもう一度お試しください。';
			document.getElementById('warning').setAttribute('style', 'display: initial;');
			document.cookie = 'allow-login=false; max-age=86400; path=/' + (debug?'':'; Domain=.featherine.com');
			return 0;
		} else if (token.includes('SERVER ERROR:')) {
			showMessage ('エラーが発生しました', 'red', token, topURL);
			return 0;
		} else if (token.includes('/var/www/html/')) {
			showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL);
			return 0;
		} 

		token = JSON.parse (token);

		if (document.getElementById('remember-me-checkbox').checked) {
			var date = new Date (token.expires*1000);
			document.cookie = 'email=' + email + '; expires=' + date.toUTCString() + '; path=/' + (debug?'':'; Domain=.featherine.com');
			document.cookie = 'password=' + password + '; expires=' + date.toUTCString() + '; path=/' + (debug?'':'; Domain=.featherine.com');
			document.cookie = 'signature=' + token.signature + '; expires=' + date.toUTCString() + '; path=/' + (debug?'':'; Domain=.featherine.com');
			document.cookie = 'expires=' + token.expires + '; expires=' + date.toUTCString() + '; path=/' + (debug?'':'; Domain=.featherine.com');
		} else {
			document.cookie = 'email=' + email + '; path=/' + (debug?'':'; Domain=.featherine.com');
			document.cookie = 'password=' + password + '; path=/' + (debug?'':'; Domain=.featherine.com');
			document.cookie = 'signature=' + token.signature + '; path=/' + (debug?'':'; Domain=.featherine.com');
			document.cookie = 'expires=' + token.expires + '; path=/' + (debug?'':'; Domain=.featherine.com');
		}
		window.location.href = redirect (topURL);
	}
}

function passwordReset () {
	window.location.href = loginURL+'/request_password_reset.html';
}