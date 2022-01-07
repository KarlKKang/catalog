// JavaScript Document
function getImage (nsfw) {
	var start = main.startPage;
	var checkXHRResponse = main.checkXHRResponse;
	var debug = main.debug;
	var sendServerRequest = main.sendServerRequest;
	
	start('404', function () {		
		sendServerRequest('request_images404.php', {
			callback: function () {
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
						document.cookie = 'image-param='+encodeURIComponent(JSON.stringify(param))+';max-age=30;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
						//window.localStorage.setItem('image-param', JSON.stringify(param));
						if (debug) {
							window.location.href = 'image.html';
						} else {
							window.open ('https://featherine.com/image');
						}
					});

					container.appendChild(image);
					document.getElementById('container').appendChild (container);
				}
			},
			content: nsfw?'nsfw=true':'',
			withCredentials: false
		});
	});
}