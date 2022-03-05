// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var debug = mainLocal.debug;
	var topURL = mainLocal.topURL;
	var logout = mainLocal.logout;
	
	
	appearanceSwitching();
	
	var param = localStorage.getItem("message-param");
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
			localStorage.removeItem("message-param");
			button.classList.add('hidden');
		} else {
			button.innerHTML = '次に進む';
			button.addEventListener('click', function () {
				localStorage.removeItem("message-param");
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