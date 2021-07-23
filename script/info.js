// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/info') && !debug) {
		window.location.href = 'https://featherine.com/info';
		return 0;
	}
	
	if (getURLParam ('nav') == 'true') {
		document.getElementById('header').classList.remove('hidden');
		document.getElementById('nav-btn').classList.remove('hidden');
		document.getElementById('main').classList.remove('no-padding');
		
		document.getElementById('nav-btn').addEventListener('click', function () {
			navUpdate ();
		});

		document.getElementById('nav-menu-content-1').addEventListener('click', function () {
			goTo('top');
		});
		document.getElementById('nav-menu-content-2').addEventListener('click', function () {
			goTo('account');
		});
		document.getElementById('nav-menu-content-3').addEventListener('click', function () {
			goTo('info');
		});
		document.getElementById('nav-menu-content-4').addEventListener('click', function () {
			logout(function () {window.location.href = redirect (loginURL);});
		});
	}
	
	handshake (function (){document.getElementsByTagName("body")[0].classList.remove("hidden");});
	
});
