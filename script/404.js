// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/404') && !debug) {
		window.location.href = 'https://featherine.com/404';
		return 0;
	}
		
	var nsfw = getURLParam ('nsfw');

	handshake (function () {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (checkXHRResponse (this)) {
					let container = document.createElement('div');
					let image = document.createElement('img');
					let overlay = document.createElement('div');
					
					container.classList.add('image-container');
					overlay.classList.add('overlay');
					
					container.appendChild(overlay);
					
					let url = this.responseText;
					image.src = url;
					image.alt = '404 image: ' + url;
					container.addEventListener ('click', function () {
						let param = {
							url: url,
							title: '404',
							withCredentials: false
						};
						window.localStorage.setItem('image-param', JSON.stringify(param));
						window.open ('image'+(debug?'.html':''));
					});
					
					container.appendChild(image);
					document.getElementById('container').appendChild (container);
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/request_images404.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send(((nsfw=='true')?'nsfw=true':''));
	});
});