// JavaScript Document
import "core-js";
import {
	debug,
	sendServerRequest,
	message,
	loginURL,
	getURLParam,
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

	
	if (!getHref().startsWith('https://login.featherine.com/password_reset') && !debug) {
		window.location.replace(loginURL);
		return;
	}
	
	
	var newPasswordInput = document.getElementById('new-password');
	var newPasswordConfirmInput = document.getElementById('new-password-confirm');
	var submitButton = document.getElementById('submit-button');
	
	
	var user = getURLParam ('user');
	var signature = getURLParam ('signature');
	var expires = getURLParam ('expires');

	if (user == null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
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

	if (expires == null || !/^[0-9]+$/.test(expires)) {
		window.location.replace(loginURL);
		return;
	}

    sendServerRequest('reset_password.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                message.show(message.template.param.expired);
				return;
            } else if (response != 'APPROVED') {
                message.show();
				return;
            }

			newPasswordInput.addEventListener('keydown', function (event) {
				if (event.key === "Enter") {
					submitRequest ();
				}
			});
			newPasswordConfirmInput.addEventListener('keydown', function (event) {
				if (event.key === "Enter") {
					submitRequest();
				}
			});
			submitButton.addEventListener('click', function () {
				submitRequest();
			});

			newPasswordInput.addEventListener('input', function () {
				passwordStyling(this);
			});
			newPasswordConfirmInput.addEventListener('input', function () {
				passwordStyling(this);
			});
			document.body.classList.remove("hidden");
        },
        content: "user="+user+"&signature="+signature+"&expires="+expires,
        withCredentials: false
    });


	async function submitRequest () {
		var warningElem = document.getElementById('warning');
		
		disableAllInputs(true);

		var newPassword = newPasswordInput.value;
		var newPasswordConfirm = newPasswordConfirmInput.value;

		if (newPassword=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(newPassword)) {
			warningElem.innerHTML = message.template.inline.invalidPasswordFormat;
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		} else if (newPassword!=newPasswordConfirm) {
			warningElem.innerHTML = message.template.inline.passwordConfirmationMismatch;
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		}

		newPassword = await hashPassword(newPassword)

		sendServerRequest('reset_password.php', {
			callback: function (response) {
                if (response == 'EXPIRED') {
					message.show(message.template.param.expired);
                } else if (response == 'DONE') {
                    message.show(message.template.param.passwordChanged);
                } else {
                    message.show();
                }
			},
			content: "user="+user+"&signature="+signature+"&expires="+expires+"&new="+newPassword,
			withCredentials: false
		});
	}
	
	function disableAllInputs(disabled) {
		submitButton.disabled = disabled;
		newPasswordInput.disabled = disabled;
		newPasswordConfirmInput.disabled = disabled;
	}
});