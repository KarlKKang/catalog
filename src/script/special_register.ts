// JavaScript Document
import "core-js";
import {
	DEVELOPMENT,
	sendServerRequest,
	message,
	passwordStyling,
	clearCookies,
	cssVarWrapper,
	hashPassword,
	
	w,
	addEventListener,
	getHref,
	redirect,
	getById,
	getByClassAt,
	openWindow,
	removeClass,
	getBody,
	disableInput
} from './module/main';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (getHref()!='https://featherine.com/special_register' && !DEVELOPMENT) {
		window.location.replace('https://featherine.com/special_register');
		redirect('https://featherine.com/special_register', true);
		return;
	}
	
	var emailInput = getById('email') as HTMLInputElement;
	var usernameInput = getById('username') as HTMLInputElement;
	var passwordInput = getById('password') as HTMLInputElement;
	var passwordConfirmInput = getById('password-confirm') as HTMLInputElement;
	var submitButton = getById('submit-button') as HTMLButtonElement;
	

	sendServerRequest('special_register.php', {
		callback: function (response: string) {
            if (response == 'APPROVED' || DEVELOPMENT) {
				addEventListener(emailInput, 'keydown', function (event) {
                    if ((event as KeyboardEvent).key === "Enter") {
                        register ();
                    }
                });
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

				passwordStyling(passwordInput);
				passwordStyling(passwordConfirmInput);

                removeClass(getBody(), "hidden");
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
	
	var warningElem = getById('warning');
	
	var email = emailInput.value;
	var username = usernameInput.value;
	var password = passwordInput.value;
	var passwordConfirm = passwordConfirmInput.value;
	
	if (email == '' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = message.template.inline.invalidEmailFormat;
		removeClass(warningElem, "hidden");
		disableAllInputs(false);
		return;
	}
	
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
                removeClass(warningElem, "hidden");
                disableAllInputs(false);
            }else if (response == 'ALREADY REGISTERED') {
                warningElem.innerHTML = message.template.inline.emailAlreadyRegistered;
                removeClass(warningElem, "hidden");
                disableAllInputs(false);
            } else if (response == 'USERNAME DUPLICATED') {
                warningElem.innerHTML = message.template.inline.usernameTaken;
                removeClass(warningElem, "hidden");
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
	disableInput(usernameInput, disabled);
	disableInput(passwordInput, disabled);
	disableInput(passwordConfirmInput, disabled);
	disableInput(emailInput, disabled);
}
	
});