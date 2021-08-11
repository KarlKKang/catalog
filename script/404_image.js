// JavaScript Document
function getImage (nsfw) {
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
							title: '404'
						};
						window.localStorage.setItem('image-param', JSON.stringify(param));
						if (debug) {
							window.location.href = 'image.html';
						} else {
							window.open ('https://featherine.com/image');
						}
					});
					
					container.appendChild(image);
					document.getElementById('container').appendChild (container);
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/request_images404.php", true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send(nsfw?'nsfw=true':'');
	});
}