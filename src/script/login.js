// JavaScript Document
import "core-js";
import {
	debug, 
	sendServerRequest, 
	message, 
	topURL,
	loginURL,
	redirect,
	passwordStyling,
	authenticate,
	disableCheckbox,
	clearCookies,
	cssVarWrapper,
	hashPassword,
	getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	if (!getHref().startsWith(loginURL) && !debug) {
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

async function login () {
	disableAllInputs(true);
	
	var warningElem = document.getElementById('warning');

	var email = usernameInput.value;
	var password = passwordInput.value;

	if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = message.template.inline.loginFailed;
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	}

	if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
		warningElem.innerHTML = message.template.inline.loginFailed;
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	}

	password = await hashPassword(password);

	var param = {
		email: email,
		password: password,
		remember_me: rememberMeInput.checked
	};

	param = JSON.stringify (param);
	
	sendServerRequest('login.php', {
		callback: function (response) {
            if (response.includes('FAILED')) {
                warningElem.innerHTML = message.template.inline.loginFailed;
                warningElem.classList.remove('hidden');
                disableAllInputs(false);
            } else if (response == 'NOT RECOMMENDED') {
                setTimeout (function () {
                    message.show(message.template.param.unrecommendedBrowser(redirect(topURL)));
                }, 500);
            } else if (response == 'APPROVED') {
                setTimeout (function () {
                    window.location.replace(redirect (topURL));
                }, 500);
            } else {
                message.show ();
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