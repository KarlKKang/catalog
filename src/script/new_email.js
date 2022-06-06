// JavaScript Document
import "core-js";
import {
	debug,
	sendServerRequest,
	message,
	topURL,
	getURLParam,
	clearCookies,
	cssVarWrapper,
	getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/new_email') && !debug) {
		window.location.replace(topURL);
		return;
	}
		
	var newEmailInput = document.getElementById('new-email');
	var submitButton = document.getElementById('submit-button');
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	
	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
		if (debug) {
			document.body.classList.remove("hidden");
		} else {
			window.location.replace(topURL);
		}
		return;
	}
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.replace(topURL);
		return;
	}

    sendServerRequest('verify_email_change.php', {
        callback: function (response) {
            if (response == 'EXPIRED') {
                message.show(message.template.param.expired);
            } else if (response == 'APPROVED') {
				newEmailInput.addEventListener('keydown', function () {
					if (event.key === "Enter") {
						submitRequest ();
					}
				});

				submitButton.addEventListener('click', function () {
					submitRequest ();
				});
                document.body.classList.remove("hidden");
            } else {
                message.show();
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });


	function submitRequest () {
		disableAllInputs(true);
		
		var warningElem = document.getElementById('warning');
		var newEmail = newEmailInput.value;

		if (newEmail == '' || !/^[^\s@]+@[^\s@]+$/.test(newEmail)) {
			warningElem.innerHTML = message.template.inline.invalidEmailFormat;
			warningElem.classList.remove('hidden');
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('verify_email_change.php', {
			callback: function (response) {
                if (response == 'EXPIRED') {
					message.show(message.template.param.expired);
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = message.template.inline.emailAlreadyInvitedOrRegistered;
                    warningElem.classList.remove('hidden');
                    disableAllInputs(false);
                } else if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = message.template.inline.invalidEmailFormat;
                    warningElem.classList.remove('hidden');
                    disableAllInputs(false);
                } else if (response == 'DONE') {
                    message.show(message.template.param.emailSent);
                } else {
                    message.show();
				}
			},
			content: "p="+param+"&signature="+signature+"&new="+newEmail,
			withCredentials: false
		});
	}
	
	function disableAllInputs(disabled) {
		submitButton.disabled = disabled;
		newEmailInput.disabled = disabled
	}
});