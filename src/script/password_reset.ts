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

	w,
	addEventListener,
	getHref,
	redirect,
	getById,
	removeClass,
	getBody
} from './module/main';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();

	
	if (!getHref().startsWith('https://login.featherine.com/password_reset') && !debug) {
		redirect(loginURL, true);
		return;
	}
	
	
	var newPasswordInput = getById('new-password') as HTMLInputElement;
	var newPasswordConfirmInput = getById('new-password-confirm') as HTMLInputElement;
	var submitButton = getById('submit-button') as HTMLButtonElement;
	
	var user = getURLParam('user');
	var signature = getURLParam('signature');
	var expires = getURLParam('expires');

	if (user === null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
		if (debug) {
			removeClass(getBody(), "hidden");
		} else {
			redirect(loginURL, true);
		}
		return;
	}
	
	if (signature === null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		redirect(loginURL, true);
		return;
	}

	if (expires === null || !/^[0-9]+$/.test(expires)) {
		redirect(loginURL, true);
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

			addEventListener(newPasswordInput, 'keydown', function (event) {
				if ((event as KeyboardEvent).key === "Enter") {
					submitRequest ();
				}
			});

			addEventListener(newPasswordConfirmInput, 'keydown', function (event) {
				if ((event as KeyboardEvent).key === "Enter") {
					submitRequest ();
				}
			});

			addEventListener(submitButton, 'click', function () {
				submitRequest();
			});

			passwordStyling(newPasswordInput);
			passwordStyling(newPasswordConfirmInput);

			removeClass(getBody(), "hidden");
        },
        content: "user="+user+"&signature="+signature+"&expires="+expires,
        withCredentials: false
    });


	async function submitRequest () {
		var warningElem = getById('warning');
		
		disableAllInputs(true);

		var newPassword = newPasswordInput.value;
		var newPasswordConfirm = newPasswordConfirmInput.value;

		if (newPassword=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(newPassword)) {
			warningElem.innerHTML = message.template.inline.invalidPasswordFormat;
			removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		} else if (newPassword!=newPasswordConfirm) {
			warningElem.innerHTML = message.template.inline.passwordConfirmationMismatch;
			removeClass(warningElem, "hidden");
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