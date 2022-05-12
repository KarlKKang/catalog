// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var debug = mainLocal.debug;
	var topURL = mainLocal.topURL;
	var logout = mainLocal.logout;
	var getCookie = mainLocal.getCookie;
	
	
	appearanceSwitching();
	
	var param = getCookie('local-message-param');
	
	var url;
	
	if (param === null) {
		if (debug) {
			document.getElementById('title').classList.add('color-orange');
			document.getElementById('title').innerHTML = 'タイトルTitle';
			document.getElementById('message').innerHTML = 'メッセージMessageメッセージMessageメッセージMessageメッセージMessageメッセージMessage';
			document.body.classList.remove("hidden");
		} else {
			window.location.replace(topURL);
		}
		return;
	}
	
	try {
		param = decodeURIComponent(param);
		param = JSON.parse(param);
	} catch (e) {
		window.location.replace(topURL);
		return;
	}
	
	var callback = function () {
		document.title = param.htmlTitle;
		document.getElementById('title').innerHTML = param.title;
		document.getElementById('title').classList.add('color-'+param.color);
		document.getElementById('message').innerHTML = param.message;
		var button = document.getElementById('button');
		url = param.url;
		if (param.url == null) {
			document.cookie = 'local-message-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
			button.classList.add('hidden');
		} else {
			button.innerHTML = '次に進む';
			button.addEventListener('click', function () {
				document.cookie = 'local-message-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
				window.location.replace(url);
			});
		}
		
		document.body.classList.remove("hidden");
	};

	if ('logout' in param) {
		if (param.logout === true) {
			logout (callback);
			return;
		}
	}
	
	callback ();

});