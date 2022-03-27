// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var topURL = mainLocal.topURL;
	var redirect = mainLocal.redirect;
	var passwordStyling = mainLocal.passwordStyling;
	var authenticate = mainLocal.authenticate;
	
	if (!window.location.href.startsWith('https://login.featherine.com') && !debug) {
		window.location.replace(redirect ('https://login.featherine.com'));
		return;
	}
	
	appearanceSwitching();
	
	var submitButton = document.getElementById('submit-button');
	var passwordInput = document.getElementById('current-password');
	var usernameInput = document.getElementById('username');
	
	authenticate({
		successful:
		function () {
			window.location.replace(topURL);
		},
		failed:
		function () {
			usernameInput.addEventListener('keydown', function (event) {
				if (event.key === "Enter") {
					login ();
				}
			});
			passwordInput.addEventListener('keydown', function (event) {
				if (event.key === "Enter") {
					login ();
				}
			});

			submitButton.addEventListener('click', function () {
				login ();
			});
			document.getElementById('forgot-password').getElementsByTagName('span')[0].addEventListener('click', function () {
				window.location.replace('request_password_reset'+(debug?'.html':''));
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

	if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = 'アカウントIDかパスワードが正しくありません。';
		warningElem.classList.remove('hidden');
		submitButton.disabled = false;
		return;
	}

	if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
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
                    showMessage ({
						title: 'お使いのブラウザは推奨されませ', 
						message: '一部のコンテンツが正常に再生されない場合は、Safariをお使いください。',
						color: 'orange', 
						url: redirect (topURL)
					});
                }, 500);
            } else if (response == 'APPROVED') {
                setTimeout (function () {
                    window.location.replace(redirect (topURL));
                }, 500);
            } else {
                showMessage ();
            }
		},
		content: "p="+encodeURIComponent(param)
	});
}
});