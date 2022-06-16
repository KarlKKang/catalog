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
	
	w,
	addEventListener,
	getHref,
	redirect,
	getById,
	removeClass,
	getBody
} from './module/main';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/new_email') && !debug) {
		redirect(topURL, true);
		return;
	}
		
	var newEmailInput = getById('new-email') as HTMLInputElement;
	var submitButton = getById('submit-button') as HTMLButtonElement;
	
	var param = getURLParam('p');
	var signature = getURLParam('signature');

	
	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
		if (debug) {
			removeClass(getBody(), "hidden");
		} else {
			redirect(topURL, true);
		}
		return;
	}
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		redirect(topURL, true);
		return;
	}

    sendServerRequest('verify_email_change.php', {
        callback: function (response: string) {
            if (response == 'EXPIRED') {
                message.show(message.template.param.expired);
            } else if (response == 'APPROVED') {
				addEventListener(newEmailInput, 'keydown', function (event) {
					if ((event as KeyboardEvent).key === "Enter") {
						submitRequest ();
					}
				});

				addEventListener(submitButton, 'click', function () {
					submitRequest ();
				});
                removeClass(getBody(), "hidden");
            } else {
                message.show();
            }
        },
        content: "p="+param+"&signature="+signature,
        withCredentials: false
    });


	function submitRequest () {
		disableAllInputs(true);
		
		var warningElem = getById('warning');
		var newEmail = newEmailInput.value;

		if (newEmail == '' || !/^[^\s@]+@[^\s@]+$/.test(newEmail)) {
			warningElem.innerHTML = message.template.inline.invalidEmailFormat;
			removeClass(warningElem, "hidden");
			disableAllInputs(false);
			return;
		}
		
		sendServerRequest('verify_email_change.php', {
			callback: function (response: string) {
                if (response == 'EXPIRED') {
					message.show(message.template.param.expired);
                } else if (response == 'DUPLICATED') {
                    warningElem.innerHTML = message.template.inline.emailAlreadyInvitedOrRegistered;
                    removeClass(warningElem, "hidden");
                    disableAllInputs(false);
                } else if (response == 'INVALID FORMAT') {
                    warningElem.innerHTML = message.template.inline.invalidEmailFormat;
                    removeClass(warningElem, "hidden");
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