// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/image') && !debug) {
		window.location.href = 'https://featherine.com/image';
		return 0;
	}
	
	var param = getCookie('image-param');
	
	if (param == '') {
		window.location.href = topURL;
		return 0;
	}
	
	document.cookie = 'image-param=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
	
	try {
		param = decodeURIComponent(param);
		param = JSON.parse(param);
	} catch (e) {
		window.location.href = topURL;
		return 0;
	}
	
	
	var image = document.createElement('img');
	
	if (!('url' in param)) {
		window.location.href = topURL;
		return 0;
	}
	
	if (!('token' in param)) {
		if (!param.url.startsWith('https://cdn.featherine.com/') || !('title' in param)) {
			window.location.href = topURL;
			return 0;
		}
		showImage ();
	} else {
		deviceAuthentication (function () {
			setInterval (function () {deviceAuthentication ();}, 60*1000);
			image.setAttribute('crossorigin', 'use-credentials');
			showImage ();
		});
	}
	
	
	function deviceAuthentication (callback) {
		if (callback === undefined) {
			callback = function () {return 0;};
		}
		
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (checkXHRResponse (this)) {
					if (this.responseText!='APPROVED') {
						showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL, true);
						return false;
					} else {
						callback ();
					}
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/device_authenticate.php", true);
		xmlhttp.withCredentials = true;
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("token="+param.token);
	}
		
	
	function showImage () {
		document.title = param.title + ' | featherine';

		var container = document.getElementById('image-container');

		image.addEventListener('error', function () {
			window.location.href = topURL;
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