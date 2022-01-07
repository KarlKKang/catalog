// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var navListeners = mainLocal.navListeners;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var loginURL = mainLocal.loginURL;
	var authenticate = mainLocal.authenticate;
	var logout = mainLocal.logout;
	
	if (!window.location.href.startsWith('https://featherine.com/info') && !debug) {
		window.location.href = 'https://featherine.com/info';
		return;
	}
	
	appearanceSwitching();
	navListeners();
	
	authenticate({
		successful: 
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
		failed: 
		function () {
			logout (function () {
				window.location.href = loginURL;
			});
		},
	});
	
});
