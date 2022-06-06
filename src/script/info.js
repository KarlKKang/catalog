// JavaScript Document
import "core-js";
import {
	debug,
	navListeners,
	sendServerRequest,
	message,
	clearCookies,
	cssVarWrapper,
	getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/info') && !debug) {
		window.location.replace('https://featherine.com/info');
		return;
	}
		
	sendServerRequest('get_info.php', {
        callback: function (response) {
            if (response.startsWith('INFOBODY:') && response.endsWith('EOF')) {
				document.getElementById('content').innerHTML = response.slice(9, -3);
				navListeners();
				document.body.classList.remove("hidden");
				var scrollID = window.location.hash;
				if (scrollID != '') {
					var elem = document.getElementById(scrollID.substring(1));
					if (elem) {
						elem.scrollIntoView({
							behavior: 'smooth'
						});
					}
				}
			} else {
				message.show();
			}
        },
		method: 'GET'
	});
});
