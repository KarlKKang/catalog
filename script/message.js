// JavaScript Document

window.addEventListener("load", function(){
	var param = localStorage.getItem("message-param");
	var url;
	
	if (param === null) {
		window.location.href = topURL;
		return 0;
	}
	
	try {
		param = JSON.parse(param);
	} catch (e) {
		window.location.href = topURL;
		return 0;
	}
	
	
	var callback = function () {
		document.title = param.htmlTitle;
		document.getElementById('title').innerHTML = param.title;
		document.getElementById('title').style.color = param.titleColor;
		document.getElementById('message').innerHTML = param.message;
		url = param.url;
		if (param.url == null) {
			document.getElementById('button').classList.add('hidden');
		} else {
			document.getElementById('button').addEventListener('click', function () {
				localStorage.removeItem("message-param");
				window.location.href = url;
			});
		}
		
		document.getElementsByTagName("body")[0].classList.remove("hidden");
	};

	if ('logout' in param) {
		if (param.logout === true) {
			logout (callback);
			return 0;
		}
	}
	
	callback ();

});