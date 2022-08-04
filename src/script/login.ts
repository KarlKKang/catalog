// JavaScript Document
import "core-js";
import {
	DEVELOPMENT,
	TOP_URL,
	LOGIN_URL,
} from './module/env/constant';
import {
	sendServerRequest, 
	passwordStyling,
	authenticate,
	disableInput,
	clearCookies,
	cssVarWrapper,
	hashPassword,
	getURLParam,
} from './module/main';
import {
	w,
	addEventListener,
	getHref,
	redirect,
	getById,
	removeClass,
	getBody,
	getDescendantsByTagAt
} from './module/DOM';
import * as message from './module/message';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!getHref().startsWith(LOGIN_URL) && !DEVELOPMENT) {
		redirect(LOGIN_URL, true);
		return;
	}
		
	var submitButton = getById('submit-button') as HTMLButtonElement;
	var passwordInput = getById('current-password') as HTMLInputElement;
	var usernameInput = getById('username') as HTMLInputElement;
	var rememberMeInput = getById('remember-me-checkbox') as HTMLInputElement;
	
	authenticate({
		successful:
		function () {
			redirect(TOP_URL, true);
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
				redirect(DEVELOPMENT?'request_password_reset.html':(LOGIN_URL+'/request_password_reset'), true);
			});
			passwordStyling(passwordInput);
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
                    message.show(message.template.param.unrecommendedBrowser(getForwardURL()));
                }, 500);
            } else if (response == 'APPROVED') {
                setTimeout (function () {
					redirect(getForwardURL(), true);
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
	disableInput(passwordInput, disabled);
	disableInput(usernameInput, disabled);
	disableInput(rememberMeInput, disabled);
}

function getForwardURL () {
	let series = getURLParam('series');
	if (series !== null && /^[a-zA-Z0-9~_-]{8,}$/.test(series)) {
		let url: string;
		let separator: '?'|'&';

		if (DEVELOPMENT) {
			url = 'bangumi.html?series=' + series;
			separator = '&';
		} else {
			url = TOP_URL + '/bangumi/' + series;
			separator = '?';
		}

		let ep = getURLParam('ep');
		if (ep !== null && ep !== '1') {
			url += separator + 'ep=' + ep;
			separator = '&';
		} 

		let format = getURLParam ('format');
		if (format !== null && format !== '1') {
			url += separator + 'format=' + format;
		}
		return url;
	}


	let keywords = getURLParam ('keywords');
	if (keywords !== null) {
		return TOP_URL + '?keywords='+keywords;
	}

	return TOP_URL;
}
});