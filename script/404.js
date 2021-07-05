// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/404.html') && !debug)
		window.location.href = 'https://featherine.com/404.html';
    initialize ();
});

var nsfw = getURLParam ('nsfw');
//var code = getURLParam ('code');
//var description = getURLParam ('description');

function initialize () {
	handshake ();
	//document.getElementById('title').innerHTML = code + ' ' + description;
	
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
}