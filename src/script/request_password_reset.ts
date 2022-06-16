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
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (DOM.getHref()!='https://login.featherine.com/request_password_reset' && !debug) {
		DOM.redirect('https://login.featherine.com/request_password_reset', true);
		return;
	}
		
	var emailInput = DOM.getById('email') as HTMLInputElement;
	var submitButton = DOM.getById('submit-button') as HTMLButtonElement;

	DOM.addEventListener(emailInput, 'keydown', function (event) {
		if ((event as KeyboardEvent).key === "Enter") {
			submitRequest ();
		}
	});

	DOM.addEventListener(submitButton, 'click', function () {
		submitRequest ();
	});

	DOM.addEventListener(DOM.getDescendantsByTagAt(DOM.getById('go-back'), 'span', 0), 'click', function () {
		DOM.redirect(loginURL, true);
	});
	
	authenticate({
		successful: 
		function () {
			DOM.redirect(topURL, true);
		},
		failed: 
		function () {
			DOM.removeClass(DOM.getBody(), "hidden");
		},
	});
	
	
	function submitRequest () {
		disableAllInputs(true);
		
		var warningElem = DOM.getById('warning');

		var email = emailInput.value;
		if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
			warningElem.innerHTML=message.template.inline.invalidEmailFormat;
			DOM.removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('send_password_reset.php', {
			callback: function (response: string) {
                if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = message.template.inline.invalidEmailFormat;
                    DOM.removeClass(warningElem, "hidden");
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