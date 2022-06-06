// JavaScript Document
import "core-js";
import {
	debug,
	getURLParam,
	sendServerRequest,
	message,
	loginURL,
	passwordStyling,
	clearCookies,
	cssVarWrapper,
	hashPassword,
	getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/register') && !debug) {
		window.location.replace(loginURL);
		return;
	}
		
	var submitButton = document.getElementById('submit-button');
	var usernameInput = document.getElementById('username');
	var passwordInput = document.getElementById('password');
	var passwordConfirmInput = document.getElementById('password-confirm');
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
		if (debug) {
			document.body.classList.remove("hidden");
		} else {
			window.location.replace(loginURL);
		}
		return;
	}

	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.replace(loginURL);
		return;
	}

    sendServerRequest('register.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                message.show(message.template.param.expired);
            } else if (response == 'SPECIAL') {
                message.show(message.template.param.specialRegistrationOnly);
            } else if (response == 'APPROVED') {
				usernameInput.addEventListener('keydown', function (event) {
					if (event.key === "Enter") {
						register ();
					}
				});
				passwordInput.addEventListener('keydown', function (event) {
					if (event.key === "Enter") {
						register ();
					}
				});
				passwordConfirmInput.addEventListener('keydown', function (event) {
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

				submitButton.addEventListener('click', function () {
					register ();
				});

				passwordInput.addEventListener('input', function () {
					passwordStyling(this);
				});
				passwordConfirmInput.addEventListener('input', function () {
					passwordStyling(this);
				});
                document.body.classList.remove("hidden");
            } else {
                message.show();
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });

	async function register () {
		disableAllInputs(true);
		
		var warningElem = document.getElementById('warning');

		var username = usernameInput.value;
		var password = passwordInput.value;
		var passwordConfirm = passwordConfirmInput.value;

		if (username == '') {
			warningElem.innerHTML = message.template.inline.usernameEmpty;
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		}

		if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
			warningElem.innerHTML = message.template.inline.invalidPasswordFormat;
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		} else if (password!=passwordConfirm) {
			warningElem.innerHTML = message.template.inline.passwordConfirmationMismatch;
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		}

		password = await hashPassword(password);

		var user = {
			username: username,
			password: password
		};

		sendServerRequest('register.php', {
			callback: function (response) {
                if (response == 'EXPIRED') {
					message.show(message.template.param.expired);
                } else if (response == 'USERNAME DUPLICATED') {
                    warningElem.innerHTML = message.template.inline.usernameTaken;
                    warningElem.classList.remove('hidden');
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    message.show(message.template.param.registerComplete);
                } else {
                    message.show();
                }
			},
			content: "p="+param+"&signature="+signature+"&user="+encodeURIComponent(JSON.stringify(user)),
			withCredentials: false
		});
	}
	
	function disableAllInputs(disabled) {
		submitButton.disabled = disabled;
		usernameInput.disabled = disabled;
		passwordInput.disabled = disabled;
		passwordConfirmInput.disabled = disabled;
	}
});