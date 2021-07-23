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
					var image = document.createElement('img');
					let url = this.responseText;
					image.src = url;
					image.alt = url;
					image.addEventListener ('click', function () {
						window.open (url);
					});
					document.getElementById('container').appendChild (image);
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/request_images404.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send(((nsfw=='true')?'nsfw=true':''));
	});
});