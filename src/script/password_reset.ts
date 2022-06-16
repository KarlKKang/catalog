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
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();

	
	if (!DOM.getHref().startsWith('https://login.featherine.com/password_reset') && !debug) {
		DOM.redirect(loginURL, true);
		return;
	}
	
	
	var newPasswordInput = DOM.getById('new-password') as HTMLInputElement;
	var newPasswordConfirmInput = DOM.getById('new-password-confirm') as HTMLInputElement;
	var submitButton = DOM.getById('submit-button') as HTMLButtonElement;
	
	var user = getURLParam('user');
	var signature = getURLParam('signature');
	var expires = getURLParam('expires');

	if (user === null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
		if (debug) {
			DOM.removeClass(DOM.getBody(), "hidden");
		} else {
			DOM.redirect(loginURL, true);
		}
		return;
	}
	
	if (signature === null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		DOM.redirect(loginURL, true);
		return;
	}

	if (expires === null || !/^[0-9]+$/.test(expires)) {
		DOM.redirect(loginURL, true);
		return;
	}

    sendServerRequest('reset_password.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                message.show(message.template.param.expired);
				return;
            } else if (response != 'APPROVED') {
                message.show();
				return;
            }

			DOM.addEventListener(newPasswordInput, 'keydown', function (event) {
				if ((event as KeyboardEvent).key === "Enter") {
					submitRequest ();
				}
			});

			DOM.addEventListener(newPasswordConfirmInput, 'keydown', function (event) {
				if ((event as KeyboardEvent).key === "Enter") {
					submitRequest ();
				}
			});

			DOM.addEventListener(submitButton, 'click', function () {
				submitRequest();
			});

			DOM.addEventListener(newPasswordInput, 'input', function () {
				passwordStyling(newPasswordInput);
			});

			DOM.addEventListener(newPasswordConfirmInput, 'input', function () {
				passwordStyling(newPasswordConfirmInput);
			});

			DOM.removeClass(DOM.getBody(), "hidden");
        },
        content: "user="+user+"&signature="+signature+"&expires="+expires,
        withCredentials: false
    });


	async function submitRequest () {
		var warningElem = DOM.getById('warning');
		
		disableAllInputs(true);

		var newPassword = newPasswordInput.value;
		var newPasswordConfirm = newPasswordConfirmInput.value;

		if (newPassword=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(newPassword)) {
			warningElem.innerHTML = message.template.inline.invalidPasswordFormat;
			DOM.removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		} else if (newPassword!=newPasswordConfirm) {
			warningElem.innerHTML = message.template.inline.passwordConfirmationMismatch;
			DOM.removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		}

		newPassword = await hashPassword(newPassword)

		sendServerRequest('reset_password.php', {
			callback: function (response: string) {
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
	
	function disableAllInputs(disabled: boolean) {
		submitButton.disabled = disabled;
		newPasswordInput.disabled = disabled;
		newPasswordConfirmInput.disabled = disabled;
	}
});