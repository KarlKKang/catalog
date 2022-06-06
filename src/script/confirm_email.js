// JavaScript Document
import "core-js";
import {
	debug,
	sendServerRequest,
	message,
	getURLParam,
	loginURL,
	clearCookies,
	getHref
} from './helper/main.js';

window.addEventListener("load", function(){
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/confirm_email') && !debug) {
		window.location.replace(loginURL);
		return;
	}
	
	var param = getURLParam ('p');
	var signature = getURLParam ('signature');

	if (param == null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
		window.location.replace(loginURL);
		return;
	}
	
	if (signature == null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
		window.location.replace(loginURL);
		return;
	}
		
	sendServerRequest('change_email.php', {
		callback: function (response) {
			if (response == 'EXPIRED') {
				message.show (message.template.param.expired);
			} else if (response == 'REJECTED') {
				message.show (message.template.param.incompletedInvitation);
			} else if (response == 'DONE') {
				message.show (message.template.param.emailChanged);
			} else {
				message.show ();
			}
		},
		content: "p="+param+"&signature="+signature,
		withCredentials: false
	});
		
});