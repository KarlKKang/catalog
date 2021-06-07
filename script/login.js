// JavaScript Document

function login () {
	
var username = SHA256 (document.getElementById('username').value);
var password = SHA256 (document.getElementById('password').value);

var usrID = generateID (username, password);

var user = {username: username, password: password, usrID: usrID};

var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
	if (this.readyState == 4 && this.status == 200) {
        checkLogin(this.responseXML);
    }
};
xhttp.open("GET", "xml/user.xml", true);
xhttp.send();
	
function checkLogin (xml) {
	usrIDs = xml.getElementsByTagName('id');
	var index = null;
	for (var i = 0; i < usrIDs.length; i++) {
		if (usrIDs[i].childNodes[0].nodeValue == user.usrID) {
			index = i;
			break;
		}
	}
	
	if (index == null) {
		document.getElementById('warning').setAttribute('style', 'display: initial;');
	}
	else {
		if (document.getElementById('remember-me-checkbox').checked) {
			document.cookie = 'username=' + user.username + '; max-age=2592000; path=/';
			document.cookie = 'password=' + user.password + '; max-age=2592000; path=/';
			document.cookie = 'usrID=' + user.usrID + '; max-age=2592000; path=/';
		} else {
			document.cookie = 'username=' + user.username + '; path=/';
			document.cookie = 'password=' + user.password + '; path=/';
			document.cookie = 'usrID=' + user.usrID + '; path=/';
		}
		window.location.href = redirect ('index.html');
	}
}
}