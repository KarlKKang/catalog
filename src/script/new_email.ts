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
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!DOM.getHref().startsWith('https://featherine.com/new_email') && !debug) {
		DOM.redirect(topURL, true);
		return;
	}
		
	var newEmailInput = DOM.getById('new-email') as HTMLInputElement;
	var submitButton = DOM.getById('submit-button') as HTMLButtonElement;
	
	var param = getURLParam('p');
	var signature = getURLParam('signature');

	
	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
		if (debug) {
			DOM.removeClass(DOM.getBody(), "hidden");
		} else {
			DOM.redirect(topURL, true);
		}
		return;
	}
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		DOM.redirect(topURL, true);
		return;
	}

    sendServerRequest('verify_email_change.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                message.show(message.template.param.expired);
            } else if (response == 'APPROVED') {
				DOM.addEventListener(newEmailInput, 'keydown', function (event) {
					if ((event as KeyboardEvent).key === "Enter") {
						submitRequest ();
					}
				});

				DOM.addEventListener(submitButton, 'click', function () {
					submitRequest ();
				});
                DOM.removeClass(DOM.getBody(), "hidden");
            } else {
                message.show();
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });


	function submitRequest () {
		disableAllInputs(true);
		
		var warningElem = DOM.getById('warning');
		var newEmail = newEmailInput.value;

		if (newEmail == '' || !/^[^\s@]+@[^\s@]+$/.test(newEmail)) {
			warningElem.innerHTML = message.template.inline.invalidEmailFormat;
			DOM.removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('verify_email_change.php', {
			callback: function (response: string) {
                if (response == 'EXPIRED') {
					message.show(message.template.param.expired);
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = message.template.inline.emailAlreadyInvitedOrRegistered;
                    DOM.removeClass(warningElem, "hidden");
                    disableAllInputs(false);
                } else if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = message.template.inline.invalidEmailFormat;
                    DOM.removeClass(warningElem, "hidden");
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
	
	function disableAllInputs(disabled: boolean) {
		submitButton.disabled = disabled;
		newEmailInput.disabled = disabled
	}
});