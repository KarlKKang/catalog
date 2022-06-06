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
	getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	if (getHref()!='https://login.featherine.com/request_password_reset' && !debug) {
		window.location.replace('https://login.featherine.com/request_password_reset');
		return;
	}
		
	var emailInput = document.getElementById('email');
	var submitButton = document.getElementById('submit-button');
	
	emailInput.addEventListener('keydown', function () {
		if (event.key === "Enter") {
			submitRequest ();
		}
	});
	
	submitButton.addEventListener('click', function () {
		submitRequest ();
	});
	document.getElementById('go-back').getElementsByTagName('span')[0].addEventListener('click', function () {
		window.location.replace(loginURL);
	});
	
	authenticate({
		successful: 
		function () {
			window.location.replace(topURL);
		},
		failed: 
		function () {
			document.body.classList.remove("hidden");
		},
	});
	
	
	function submitRequest () {
		disableAllInputs(true);
		
		var warningElem = document.getElementById('warning');

		var email = emailInput.value;
		if (email=='' || !/^[^\s@]+@[^\s@]+$/.test(email)) {
			warningElem.innerHTML=message.template.inline.invalidEmailFormat;
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('send_password_reset.php', {
			callback: function (response) {
                if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = message.template.inline.invalidEmailFormat;
                    warningElem.classList.remove('hidden');
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
	
	function disableAllInputs(disabled) {
		submitButton.disabled = disabled;
		emailInput.disabled = disabled;
	}
});