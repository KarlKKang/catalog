// JavaScript Document
import "core-js";
import {
	DEVELOPMENT,
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
	
	if (!getHref().startsWith('https://featherine.com/policy') && !DEVELOPMENT) {
		redirect('https://featherine.com/policy', true);
		return;
	}
		
	authenticate({
		successful: 
		function () {
			redirect('info'+(DEVELOPMENT?'.html':''), true);
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