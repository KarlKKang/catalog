// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var loginURL = mainLocal.loginURL;
	var topURL = mainLocal.topURL;
	var redirect = mainLocal.redirect;
	var passwordStyling = mainLocal.passwordStyling;
	var goTo = mainLocal.goTo;
	var authenticate = mainLocal.authenticate;
	
	if (!window.location.href.startsWith('https://login.featherine.com') && !debug) {
		window.location.href = redirect ('https://login.featherine.com');
		return;
	}
	
	appearanceSwitching();
	
	var submitButton = document.getElementById('submit-button');
	var passwordInput = document.getElementById('password');
	var usernameInput = document.getElementById('username');
	
	authenticate({
		successful:
		function () {
			window.location.href = topURL;
		},
		failed:
		function () {
			usernameInput.addEventListener('keydown', function () {
				if (event.key === "Enter") {
					login ();
				}
			});
			passwordInput.addEventListener('keydown', function () {
				if (event.key === "Enter") {
					login ();
				}
			});

			submitButton.addEventListener('click', function () {
				login ();
			});
			document.getElementById('forgot-password').getElementsByTagName('span')[0].addEventListener('click', function () {
				passwordReset ();
			});

			passwordInput.addEventListener('input', function () {
				passwordStyling(this);
			});
			document.body.classList.remove("hidden");
		}
	});

function login () {
	submitButton.disabled = true;
	
	var warningElem = document.getElementById('warning');

	var email = usernameInput.value;
	var password = passwordInput.value;

	if (email=='' || email.match(/^[^\s@]+@[^\s@]+$/)===null) {
		warningElem.innerHTML = 'アカウントIDかパスワードが正しくありません。';
		warningElem.classList.remove('hidden');
		submitButton.disabled = false;
		return;
	}

	if (password=='' || password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		warningElem.innerHTML = 'アカウントIDかパスワードが正しくありません。';
		warningElem.classList.remove('hidden');
		submitButton.disabled = false;
		return;
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
	
	sendServerRequest('login.php', {
		callback: function (response) {
            if (response.includes('FAILED')) {
                warningElem.innerHTML = 'アカウントIDかパスワードが正しくありません。';
                warningElem.classList.remove('hidden');
                submitButton.disabled = false;
            } else if (response == 'NOT RECOMMENDED') {
                setTimeout (function () {
                    showMessage ('お使いのブラウザは推奨されませ', 'orange', '一部のコンテンツが正常に再生されない場合は、Safariをお使いください。', topURL);
                }, 500);
            } else if (response == 'APPROVED') {
                setTimeout (function () {
                    window.location.href = redirect (topURL);
                }, 500);
            } else {
                showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。このエラーが続く場合は、管理者にお問い合わせください。', loginURL);
            }
		},
		content: "p="+encodeURIComponent(param)
	});
}

function passwordReset () {
	goTo('request_password_reset');
}
});