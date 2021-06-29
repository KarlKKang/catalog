// JavaScript Document

window.addEventListener("load", function(){
    initialize ();
});

var param = getURLParam ('p');
var url;
function initialize () {
	if (param == null) {
		window.location.href = topURL;
		return 0;
	}
	param = JSON.parse(param);
	
	document.title = param.htmlTitle;
	document.getElementById('title').innerHTML = param.title;
	document.getElementById('title').style.color = param.titleColor;
	document.getElementById('message').innerHTML = param.message;
	url = param.url;
	if (param.url == null) {
		document.getElementById('button').style.display = 'none';
	}
}

function goToNext () {
	window.location.href = url;
}