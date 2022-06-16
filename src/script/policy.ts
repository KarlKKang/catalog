// JavaScript Document
import "core-js";
import {
	debug,
	authenticate,
	clearCookies,
	cssVarWrapper,
	
	w,
	addEventListener,
	getHref,
	redirect,
	removeClass,
	getBody,
	getHash,
	getByIdNative
} from './module/main';

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!getHref().startsWith('https://featherine.com/policy') && !debug) {
		redirect('https://featherine.com/policy', true);
		return;
	}
		
	authenticate({
		successful: 
		function () {
			redirect('info'+(debug?'.html':''), true);
		},
		failed: 
		function () {
			removeClass(getBody(), "hidden");
			var scrollID = getHash();
			if (scrollID != '') {
				var elem = getByIdNative(scrollID);
				if (elem !== null) {
					elem.scrollIntoView({
						behavior: 'smooth'
					});
				}
			}
		},
	});
	
});