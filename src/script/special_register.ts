// JavaScript Document
import "core-js";
import {
	debug,
	sendServerRequest,
	message,
	passwordStyling,
	clearCookies,
	cssVarWrapper,
	hashPassword,
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (DOM.getHref()!='https://featherine.com/special_register' && !debug) {
		window.location.replace('https://featherine.com/special_register');
		DOM.redirect('https://featherine.com/special_register', true);
		return;
	}
	
	var emailInput = DOM.getById('email') as HTMLInputElement;
	var usernameInput = DOM.getById('username') as HTMLInputElement;
	var passwordInput = DOM.getById('password') as HTMLInputElement;
	var passwordConfirmInput = DOM.getById('password-confirm') as HTMLInputElement;
	var submitButton = DOM.getById('submit-button') as HTMLButtonElement;
	

	sendServerRequest('special_register.php', {
		callback: function (response: string) {
            if (response == 'APPROVED' || debug) {
				DOM.addEventListener(emailInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === "Enter") {
                        register ();
                    }
                });
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
            } else if (response == 'REJECTED') {
				message.show(message.template.param.invitationOnly);
            } else {
                message.show();
            }
		},
		content: "status_only=true",
		withCredentials: false
	});
	
async function register () {
	disableAllInputs(true);
	
	var warningElem = DOM.getById('warning');
	
	var email = emailInput.value;
	var username = usernameInput.value;
	var password = passwordInput.value;
	var passwordConfirm = passwordConfirmInput.value;
	
	if (email == '' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = message.template.inline.invalidEmailFormat;
		DOM.removeClass(warningElem, "hidden");
		disableAllInputs(false);
		return;
	}
	
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
		email: email,
		username: username,
		password: password
	};
	
	sendServerRequest('special_register.php', {
		callback: function (response: string) {
            if (response == 'REJECTED') {
				message.show(message.template.param.invitationOnly);
            } else if (response == 'INVALID FORMAT') {
                warningElem.innerHTML = message.template.inline.invalidEmailFormat;
                DOM.removeClass(warningElem, "hidden");
                disableAllInputs(false);
            }else if (response == 'ALREADY REGISTERED') {
                warningElem.innerHTML = message.template.inline.emailAlreadyRegistered;
                DOM.removeClass(warningElem, "hidden");
                disableAllInputs(false);
            } else if (response == 'USERNAME DUPLICATED') {
                warningElem.innerHTML = message.template.inline.usernameTaken;
                DOM.removeClass(warningElem, "hidden");
                disableAllInputs(false);
            } else if (response == 'DONE') {
                message.show(message.template.param.emailSent);
            } else {
                message.show();
            }
		},
		content: "user="+encodeURIComponent(JSON.stringify(user)),
		withCredentials: false
	});
}
	
function disableAllInputs(disabled: boolean) {
	submitButton.disabled = disabled;
	usernameInput.disabled = disabled;
	passwordInput.disabled = disabled;
	passwordConfirmInput.disabled = disabled;
	emailInput.disabled = disabled;
}
	
});