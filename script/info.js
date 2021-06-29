// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/info.html') && !debug) {
		window.location.href = 'https://featherine.com/info.html';
	}
    handshake ();
	if (getURLParam ('disable-nav') == 'true') {
		document.getElementById('header').style.display = 'none';
		document.getElementById('nav-btn').style.display = 'none';
		document.getElementById('main').style.padding = '0px';
	}
});
