// JavaScript Document
import "core-js";
import {
	debug,
	authenticate,
	clearCookies,
	cssVarWrapper
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	if (!window.location.href.startsWith('https://featherine.com/policy') && !debug) {
		window.location.replace('https://featherine.com/policy');
		return;
	}
		
	authenticate({
		successful: 
		function () {
			window.location.replace('info'+(debug?'.html':''));
		},
		failed: 
		function () {
			document.body.classList.remove("hidden");
			var scrollID = window.location.hash;
			if (scrollID != '') {
				var elem = document.getElementById(scrollID.substr(1));
				if (elem) {
					elem.scrollIntoView({
						behavior: 'smooth'
					});
				}
			}
		},
	});
	
});