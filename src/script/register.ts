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
	
	w,
	addEventListener,
	getHref,
	redirect,
	getById,
	removeClass,
	getBody,
	getByClassAt,
	openWindow
} from './module/main';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/register') && !debug) {
		redirect(loginURL, true);
		return;
	}
		
	var submitButton = getById('submit-button') as HTMLButtonElement;
	var usernameInput = getById('username') as HTMLInputElement;
	var passwordInput = getById('password') as HTMLInputElement;
	var passwordConfirmInput = getById('password-confirm') as HTMLInputElement;
	
	var param = getURLParam('p');
	var signature = getURLParam('signature');

	if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
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

    sendServerRequest('register.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                message.show(message.template.param.expired);
            } else if (response == 'SPECIAL') {
                message.show(message.template.param.specialRegistrationOnly);
            } else if (response == 'APPROVED') {
				addEventListener(usernameInput, 'keydown', function (event) {
					if ((event as KeyboardEvent).key === "Enter") {
						register ();
					}
				});
				addEventListener(passwordInput, 'keydown', function (event) {
					if ((event as KeyboardEvent).key === "Enter") {
						register ();
					}
				});
				addEventListener(passwordConfirmInput, 'keydown', function (event) {
					if ((event as KeyboardEvent).key === "Enter") {
						register ();
					}
				});


				addEventListener(getByClassAt('link', 0), 'click', function () {
					openWindow('policy');
				});
				addEventListener(getByClassAt('link', 1), 'click', function () {
					openWindow('policy#en');
				});
				addEventListener(getByClassAt('link', 2), 'click', function () {
					openWindow('policy#zh-Hant');
				});
				addEventListener(getByClassAt('link', 3), 'click', function () {
					openWindow('policy#zh-Hans');
				});

				addEventListener(submitButton, 'click', function () {
					register ();
				});

				addEventListener(passwordInput, 'input', function () {
					passwordStyling(passwordInput);
				});
				addEventListener(passwordConfirmInput, 'input', function () {
					passwordStyling(passwordConfirmInput);
				});

                removeClass(getBody(), "hidden");
            } else {
                message.show();
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });

	async function register () {
		disableAllInputs(true);
		
		var warningElem = getById('warning');

		var username = usernameInput.value;
		var password = passwordInput.value;
		var passwordConfirm = passwordConfirmInput.value;

		if (username == '') {
			warningElem.innerHTML = message.template.inline.usernameEmpty;
			removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		}

		if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
			warningElem.innerHTML = message.template.inline.invalidPasswordFormat;
			removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		} else if (password!=passwordConfirm) {
			warningElem.innerHTML = message.template.inline.passwordConfirmationMismatch;
			removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		}

		password = await hashPassword(password);

		var user = {
			username: username,
			password: password
		};

		sendServerRequest('register.php', {
			callback: function (response: string) {
                if (response == 'EXPIRED') {
					message.show(message.template.param.expired);
                } else if (response == 'USERNAME DUPLICATED') {
                    warningElem.innerHTML = message.template.inline.usernameTaken;
                    removeClass(warningElem, "hidden");
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
	
	function disableAllInputs(disabled: boolean) {
		submitButton.disabled = disabled;
		usernameInput.disabled = disabled;
		passwordInput.disabled = disabled;
		passwordConfirmInput.disabled = disabled;
	}
});