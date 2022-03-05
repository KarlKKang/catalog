// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var getCookie = mainLocal.getCookie;
	var topURL = mainLocal.topURL;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	
	if (!window.location.href.startsWith('https://featherine.com/image') && !debug) {
		window.location.replace('https://featherine.com/image');
		return;
	}
	
	var param = getCookie('image-param');
	
	if (param == '') {
		window.location.replace(topURL);
		return;
	}
	
	document.cookie = 'image-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
	
	try {
		param = decodeURIComponent(param);
		param = JSON.parse(param);
	} catch (e) {
		window.location.replace(topURL);
		return;
	}
	
	
	var image = document.createElement('img');
	
	if (!('url' in param) || !('title' in param)) {
		window.location.replace(topURL);
		return;
	}
	
	if ('token' in param) {
		deviceAuthentication (function () {
			setInterval (function () {deviceAuthentication ();}, 60*1000);
			image.setAttribute('crossorigin', 'use-credentials');
			showImage ();
		});
	} else {
		if (!param.url.startsWith('https://cdn.featherine.com/')) {
			window.location.replace(topURL);
			return;
		}
		showImage ();
	}
	
	
	function deviceAuthentication (callback) {
		if (callback === undefined) {
			callback = function () {return;};
		}
		
		sendServerRequest('device_authenticate.php', {
			callback: function (response) {
				if (response!='APPROVED') {
					showMessage ();
					return false;
				} else {
					callback ();
				}
			},
			content: "token="+param.token
		});
	}
		
	
	function showImage () {
		document.title = param.title + ' | featherine';

		var container = document.getElementById('image-container');

		image.addEventListener('error', function () {
			window.location.replace(topURL);
		});

		image.addEventListener('load', function () {
			container.style.width = this.width + 'px';
			container.style.height = this.height + 'px';
		});

		image.src = param.url;
		image.alt = 'image from ' + param.title;

		container.addEventListener('contextmenu', event => event.preventDefault());

		container.appendChild(image);
	}
	
});