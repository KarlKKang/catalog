// JavaScript Document
import "core-js";
import {
	debug,
	authenticate,
	clearCookies,
	cssVarWrapper,
	DOM
} from './module/main';

DOM.addEventListener(DOM.w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!DOM.getHref().startsWith('https://featherine.com/policy') && !debug) {
		DOM.redirect('https://featherine.com/policy', true);
		return;
	}
		
	authenticate({
		successful: 
		function () {
			DOM.redirect('info'+(debug?'.html':''), true);
		},
		failed: 
		function () {
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
		},
	});
	
});