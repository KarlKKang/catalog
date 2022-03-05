// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var authenticate = mainLocal.authenticate;
	
	if (!window.location.href.startsWith('https://featherine.com/policy') && !debug) {
		window.location.replace('https://featherine.com/policy');
		return;
	}
	
	appearanceSwitching();
	
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