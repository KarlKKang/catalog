// JavaScript Document
import "core-js";
import {
	debug,
	navListeners,
	sendServerRequest,
	message,
	clearCookies,
	cssVarWrapper,
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!DOM.getHref().startsWith('https://featherine.com/info') && !debug) {
		DOM.redirect('https://featherine.com/info', true);
		return;
	}
		
	sendServerRequest('get_info.php', {
        callback: function (response: string) {
            if (response.startsWith('INFOBODY:') && response.endsWith('EOF')) {
				DOM.getById('content').innerHTML = response.slice(9, -3);
				navListeners();
				DOM.removeClass(DOM.getBody(), "hidden");
				var scrollID = DOM.getHash();
				if (scrollID != '') {
					var elem = DOM.getByIdNative(scrollID);
					if (elem !== null) {
						elem.scrollIntoView({
							behavior: 'smooth'
						});
					}
				}
			} else {
				message.show(message.template.param.server.invalidResponse);
			}
        },
		method: 'GET'
	});
});
