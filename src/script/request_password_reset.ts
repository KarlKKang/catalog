// JavaScript Document
import "core-js";
import {
	debug,
	sendServerRequest,
	message,
	loginURL,
	topURL,
	authenticate,
	clearCookies,
	cssVarWrapper,
	
	w,
	addEventListener,
	getHref,
	redirect,
	getById,
	getDescendantsByTagAt,
	removeClass,
	getBody
} from './module/main';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (getHref()!='https://login.featherine.com/request_password_reset' && !debug) {
		redirect('https://login.featherine.com/request_password_reset', true);
		return;
	}
		
	var emailInput = getById('email') as HTMLInputElement;
	var submitButton = getById('submit-button') as HTMLButtonElement;

	addEventListener(emailInput, 'keydown', function (event) {
		if ((event as KeyboardEvent).key === "Enter") {
			submitRequest ();
		}
	});

	addEventListener(submitButton, 'click', function () {
		submitRequest ();
	});

	addEventListener(getDescendantsByTagAt(getById('go-back'), 'span', 0), 'click', function () {
		redirect(loginURL, true);
	});
	
	authenticate({
		successful: 
		function () {
			redirect(topURL, true);
		},
		failed: 
		function () {
			removeClass(getBody(), "hidden");
		},
	});
	
	
	function submitRequest () {
		disableAllInputs(true);
		
		var warningElem = getById('warning');

		var email = emailInput.value;
		if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
			warningElem.innerHTML=message.template.inline.invalidEmailFormat;
			removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('send_password_reset.php', {
			callback: function (response: string) {
                if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = message.template.inline.invalidEmailFormat;
                    removeClass(warningElem, "hidden");
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    message.show(message.template.param.emailSent);
                } else {
                    message.show();
                }
			},
			content: "email="+email,
			withCredentials: false
		})
	}
	
	function disableAllInputs(disabled: boolean) {
		submitButton.disabled = disabled;
		emailInput.disabled = disabled;
	}
});