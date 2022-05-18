// JavaScript Document
import "core-js";
import {
	debug, 
	sendServerRequest, 
	showMessage, 
	topURL,
	loginURL,
	redirect,
	passwordStyling,
	authenticate,
	disableCheckbox,
	clearCookies
} from './helper/main.js';
import sha512 from 'node-forge/lib/sha512';

window.addEventListener("load", function(){

	clearCookies();
	
	if (!window.location.href.startsWith(loginURL) && !debug) {
		window.location.replace(loginURL);
		return;
	}
		
	var submitButton = document.getElementById('submit-button');
	var passwordInput = document.getElementById('current-password');
	var usernameInput = document.getElementById('username');
	var rememberMeInput = document.getElementById('remember-me-checkbox');
	
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
				window.location.replace(debug?'request_password_reset.html':(loginURL+'/request_password_reset'));
			});

			passwordInput.addEventListener('input', function () {
				passwordStyling(this);
			});
			document.body.classList.remove("hidden");
		}
	});

function login () {
	disableAllInputs(true);
	
	var warningElem = document.getElementById('warning');

	var email = usernameInput.value;
	var password = passwordInput.value;

	if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = 'アカウントIDかパスワードが正しくありません。';
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	}

	if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
		warningElem.innerHTML = 'アカウントIDかパスワードが正しくありません。';
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	} else {
		var hash = sha512.sha256.create();
		hash.update(password);
		password = hash.digest().toHex();
	}

	var param = {
		email: email,
		password: password,
		remember_me: rememberMeInput.checked
	};

	param = JSON.stringify (param);
	
	sendServerRequest('login.php', {
		callback: function (response) {
            if (response.includes('FAILED')) {
                warningElem.innerHTML = 'アカウントIDかパスワードが正しくありません。';
                warningElem.classList.remove('hidden');
                disableAllInputs(false);
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
	
function disableAllInputs (disabled) {
	submitButton.disabled = disabled;
	passwordInput.disabled = disabled;
	usernameInput.disabled = disabled;
	disableCheckbox(rememberMeInput, disabled);
}
});