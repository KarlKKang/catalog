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
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!DOM.getHref().startsWith('https://featherine.com/register') && !debug) {
		DOM.redirect(loginURL, true);
		return;
	}
		
	var submitButton = DOM.getById('submit-button') as HTMLButtonElement;
	var usernameInput = DOM.getById('username') as HTMLInputElement;
	var passwordInput = DOM.getById('password') as HTMLInputElement;
	var passwordConfirmInput = DOM.getById('password-confirm') as HTMLInputElement;
	
	var param = getURLParam('p');
	var signature = getURLParam('signature');

	if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
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

    sendServerRequest('register.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                message.show(message.template.param.expired);
            } else if (response == 'SPECIAL') {
                message.show(message.template.param.specialRegistrationOnly);
            } else if (response == 'APPROVED') {
				DOM.addEventListener(usernameInput, 'keydown', function (event) {
					if ((event as KeyboardEvent).key === "Enter") {
						register ();
					}
				});
				DOM.addEventListener(passwordInput, 'keydown', function (event) {
					if ((event as KeyboardEvent).key === "Enter") {
						register ();
					}
				});
				DOM.addEventListener(passwordConfirmInput, 'keydown', function (event) {
					if ((event as KeyboardEvent).key === "Enter") {
						register ();
					}
				});


				DOM.addEventListener(DOM.getByClassAt('link', 0), 'click', function () {
					DOM.openWindow('policy');
				});
				DOM.addEventListener(DOM.getByClassAt('link', 1), 'click', function () {
					DOM.openWindow('policy#en');
				});
				DOM.addEventListener(DOM.getByClassAt('link', 2), 'click', function () {
					DOM.openWindow('policy#zh-Hant');
				});
				DOM.addEventListener(DOM.getByClassAt('link', 3), 'click', function () {
					DOM.openWindow('policy#zh-Hans');
				});

				DOM.addEventListener(submitButton, 'click', function () {
					register ();
				});

				DOM.addEventListener(passwordInput, 'input', function () {
					passwordStyling(passwordInput);
				});
				DOM.addEventListener(passwordConfirmInput, 'input', function () {
					passwordStyling(passwordConfirmInput);
				});

                DOM.removeClass(DOM.getBody(), "hidden");
            } else {
                message.show();
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });

	async function register () {
		disableAllInputs(true);
		
		var warningElem = DOM.getById('warning');

		var username = usernameInput.value;
		var password = passwordInput.value;
		var passwordConfirm = passwordConfirmInput.value;

		if (username == '') {
			warningElem.innerHTML = message.template.inline.usernameEmpty;
			DOM.removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		}

		if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
			warningElem.innerHTML = message.template.inline.invalidPasswordFormat;
			DOM.removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		} else if (password!=passwordConfirm) {
			warningElem.innerHTML = message.template.inline.passwordConfirmationMismatch;
			DOM.removeClass(warningElem, "hidden");
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
                    DOM.removeClass(warningElem, "hidden");
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