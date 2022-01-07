// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var goTo = mainLocal.goTo;
	var authenticate = mainLocal.authenticate;
	
	if (!window.location.href.startsWith('https://featherine.com/policy') && !debug) {
		window.location.href = 'https://featherine.com/policy';
		return;
	}
	
	appearanceSwitching();
	
	authenticate({
		successful: 
		function () {
			goTo ('info');
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