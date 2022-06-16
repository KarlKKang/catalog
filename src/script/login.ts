// JavaScript Document
import "core-js";
import {
	debug, 
	sendServerRequest, 
	message, 
	topURL,
	loginURL,
	urlWithParam,
	passwordStyling,
	authenticate,
	disableCheckbox,
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
	getDescendantsByTagAt
} from './module/main';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!getHref().startsWith(loginURL) && !debug) {
		redirect(loginURL, true);
		return;
	}
		
	var submitButton = getById('submit-button') as HTMLButtonElement;
	var passwordInput = getById('current-password') as HTMLInputElement;
	var usernameInput = getById('username') as HTMLInputElement;
	var rememberMeInput = getById('remember-me-checkbox') as HTMLInputElement;
	
	authenticate({
		successful:
		function () {
			redirect(topURL, true);
		},
		failed:
		function () {
			addEventListener(usernameInput, 'keydown', function (event) {
				if ((event as KeyboardEvent).key === "Enter") {
					login ();
				}
			});
			addEventListener(passwordInput, 'keydown', function (event) {
				if ((event as KeyboardEvent).key === "Enter") {
					login ();
				}
			})

			addEventListener(submitButton, 'click', function () {
				login ();
			});
			addEventListener(getDescendantsByTagAt(getById('forgot-password'), 'span', 0), 'click', function () {
				redirect(debug?'request_password_reset.html':(loginURL+'/request_password_reset'), true);
			});
			addEventListener(passwordInput, 'input', function () {
				passwordStyling(passwordInput);
			});
			removeClass(getBody(), "hidden");
		}
	});

async function login () {
	disableAllInputs(true);
	
	var warningElem = getById('warning');

	var email = usernameInput.value;
	var password = passwordInput.value;

	if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = message.template.inline.loginFailed;
		removeClass(warningElem, 'hidden');
		disableAllInputs(false);
		return;
	}

	if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
		warningElem.innerHTML = message.template.inline.loginFailed;
		removeClass(warningElem, 'hidden');
		disableAllInputs(false);
		return;
	}

	password = await hashPassword(password);

	var param = {
		email: email,
		password: password,
		remember_me: rememberMeInput.checked
	};

	var paramString = JSON.stringify (param);
	
	sendServerRequest('login.php', {
		callback: function (response: string) {
            if (response.includes('FAILED')) {
                warningElem.innerHTML = message.template.inline.loginFailed;
                removeClass(warningElem, 'hidden');
                disableAllInputs(false);
            } else if (response == 'NOT RECOMMENDED') {
                setTimeout (function () {
                    message.show(message.template.param.unrecommendedBrowser(urlWithParam(topURL)));
                }, 500);
            } else if (response == 'APPROVED') {
                setTimeout (function () {
					redirect(urlWithParam(topURL), true);
                }, 500);
            } else {
                message.show ();
            }
		},
		content: "p="+encodeURIComponent(paramString)
	});
}
	
function disableAllInputs (disabled: boolean) {
	submitButton.disabled = disabled;
	passwordInput.disabled = disabled;
	usernameInput.disabled = disabled;
	disableCheckbox(rememberMeInput, disabled);
}
});