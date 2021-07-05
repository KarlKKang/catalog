// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/info.html') && !debug) {
		window.location.href = 'https://featherine.com/info.html';
	}
    handshake ();
	if (getURLParam ('nav') == 'true') {
		document.getElementById('header').removeAttribute ('style');
		document.getElementById('nav-btn').removeAttribute ('style');
		document.getElementById('main').removeAttribute ('style');
	}
	document.getElementsByTagName("body")[0].style.display = "block";
});
