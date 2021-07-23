// JavaScript Document

window.addEventListener("load", function(){
	var param = getURLParam ('p');
	var url;
	
	if (param == null) {
		window.location.href = topURL;
		return 0;
	}
	param = JSON.parse(param);
	
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