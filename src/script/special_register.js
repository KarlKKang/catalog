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
	getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	if (getHref()!='https://featherine.com/special_register' && !debug) {
		window.location.replace('https://featherine.com/special_register');
		return;
	}
	
	var emailInput = document.getElementById('email');
	var usernameInput = document.getElementById('username');
	var passwordInput = document.getElementById('password');
	var passwordConfirmInput = document.getElementById('password-confirm');
	var submitButton = document.getElementById('submit-button');
	
	initialize ();
	
function initialize () {
	sendServerRequest('special_register.php', {
		callback: function (response) {
            if (response == 'APPROVED' || debug) {
                emailInput.addEventListener('keydown', function (event) {
                    if (event.key === "Enter") {
                        register ();
                    }
                });
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
            } else if (response == 'REJECTED') {
				message.show(message.template.param.invitationOnly);
            } else {
                message.show();
            }
		},
		content: "status_only=true",
		withCredentials: false
	});
}
	
async function register () {
	disableAllInputs(true);
	
	var warningElem = document.getElementById('warning');
	
	var email = emailInput.value;
	var username = usernameInput.value;
	var password = passwordInput.value;
	var passwordConfirm = passwordConfirmInput.value;
	
	if (email == '' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = message.template.inline.invalidEmailFormat;
		warningElem.classList.remove('hidden');
		disableAllInputs(false);
		return;
	}
	
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
		email: email,
		username: username,
		password: password
	};
	
	sendServerRequest('special_register.php', {
		callback: function (response) {
            if (response == 'REJECTED') {
				message.show(message.template.param.invitationOnly);
            } else if (response == 'INVALID FORMAT') {
                warningElem.innerHTML = message.template.inline.invalidEmailFormat;
                warningElem.classList.remove('hidden');
                disableAllInputs(false);
            }else if (response == 'ALREADY REGISTERED') {
                warningElem.innerHTML = message.template.inline.emailAlreadyRegistered;
                warningElem.classList.remove('hidden');
                disableAllInputs(false);
            } else if (response == 'USERNAME DUPLICATED') {
                warningElem.innerHTML = message.template.inline.usernameTaken;
                warningElem.classList.remove('hidden');
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
	
function disableAllInputs(disabled) {
	submitButton.disabled = disabled;
	usernameInput.disabled = disabled;
	passwordInput.disabled = disabled;
	passwordConfirmInput.disabled = disabled;
	emailInput.disabled = disabled;
}
	
});