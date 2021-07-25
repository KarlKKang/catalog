// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/image') && !debug) {
		window.location.href = 'https://featherine.com/image';
		return 0;
	}
	
	var param = localStorage.getItem("image-param");
	localStorage.removeItem("image-param");
	
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
		
	if (!param.url.startsWith('https://cdn.featherine.com/')) {
		window.location.href = topURL;
		return 0;
	}
	
	document.title = param.title + ' | featherine';

	var image = document.createElement('img');
	var container = document.getElementById('image-container');
	
	image.addEventListener('error', function () {
		window.location.href = topURL;
	});
	
	image.addEventListener('load', function () {
		container.style.width = this.width + 'px';
		container.style.height = this.height + 'px';
	});
	
	if (param.withCredentials) {
		image.setAttribute('crossorigin', 'use-credentials');
	}
	
	image.src = param.url;
	image.alt = 'image from ' + param.title;
	
	container.addEventListener('contextmenu', event => event.preventDefault());
	
	container.appendChild(image);
});