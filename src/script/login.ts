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
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!DOM.getHref().startsWith(loginURL) && !debug) {
		DOM.redirect(loginURL, true);
		return;
	}
		
	var submitButton = DOM.getById('submit-button') as HTMLButtonElement;
	var passwordInput = DOM.getById('current-password') as HTMLInputElement;
	var usernameInput = DOM.getById('username') as HTMLInputElement;
	var rememberMeInput = DOM.getById('remember-me-checkbox') as HTMLInputElement;
	
	authenticate({
		successful:
		function () {
			DOM.redirect(topURL, true);
		},
		failed:
		function () {
			DOM.addEventListener(usernameInput, 'keydown', function (event) {
				if ((event as KeyboardEvent).key === "Enter") {
					login ();
				}
			});
			DOM.addEventListener(passwordInput, 'keydown', function (event) {
				if ((event as KeyboardEvent).key === "Enter") {
					login ();
				}
			})

			DOM.addEventListener(submitButton, 'click', function () {
				login ();
			});
			DOM.addEventListener(DOM.getDescendantsByTagAt(DOM.getById('forgot-password'), 'span', 0), 'click', function () {
				DOM.redirect(debug?'request_password_reset.html':(loginURL+'/request_password_reset'), true);
			});
			DOM.addEventListener(passwordInput, 'input', function () {
				passwordStyling(passwordInput);
			});
			DOM.removeClass(DOM.getBody(), "hidden");
		}
	});

async function login () {
	disableAllInputs(true);
	
	var warningElem = DOM.getById('warning');

	var email = usernameInput.value;
	var password = passwordInput.value;

	if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
		warningElem.innerHTML = message.template.inline.loginFailed;
		DOM.removeClass(warningElem, 'hidden');
		disableAllInputs(false);
		return;
	}

	if (password=='' || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
		warningElem.innerHTML = message.template.inline.loginFailed;
		DOM.removeClass(warningElem, 'hidden');
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
                DOM.removeClass(warningElem, 'hidden');
                disableAllInputs(false);
            } else if (response == 'NOT RECOMMENDED') {
                setTimeout (function () {
                    message.show(message.template.param.unrecommendedBrowser(urlWithParam(topURL)));
                }, 500);
            } else if (response == 'APPROVED') {
                setTimeout (function () {
					DOM.redirect(urlWithParam(topURL), true);
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