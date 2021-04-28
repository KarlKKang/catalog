// JavaScript Document

var permittedType = '';
var permittedID = [];
var resourceURL = '';

function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

function start (currentPage) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			checkUser(this.responseXML, currentPage);
		}
	};
	xhttp.open("GET", "xml/user.xml", true);
	xhttp.send();
}

function checkUser (xml, currentPage) {
	var usrID = getCookie('usrID');
	var usrIDs = xml.getElementsByTagName('id');
	var index = null;
	if (usrID != '') {
		for (var i = 0; i < usrIDs.length; i++) {
			if (usrIDs[i].childNodes[0].nodeValue == usrID) {
				index = i;
			}
		}
	}
	
	if (index == null) {
		if (currentPage != 'login')
			window.location.href = generateURL('login.html');
	} else {
		if (currentPage == 'login')
			window.location.href = generateURL('index.html');
		else 
			setPermission (xml, index);
	}
}

function setPermission (xml, index) {
	var userNode = xml.getElementsByTagName('user')[index];
	var types = userNode.getElementsByTagName('permission')[0].getElementsByTagName('type');
	var ids = userNode.getElementsByTagName('permission')[0].getElementsByTagName('id');
	
	if (types[0].childNodes[0].nodeValue == 'all') {
		permittedType = 'video, image, audio';
	} else {
		for (var i = 0; i < types.length; i++) {
			permittedType += types[i].childNodes[0].nodeValue + ', ';
		}
		permittedType = permittedType.substring(0, permittedType.length - 2);
	}
	
	if (ids.length != 0) {
		for (i = 0; i < ids.length; i++) {
			permittedID.push(ids[i].childNodes[0].nodeValue);
		}
	}
	
	resourceURL = userNode.getElementsByTagName('url')[0].childNodes[0].nodeValue;
	resourceURL = decryptAES (resourceURL, SHA256 (getCookie('username') + getCookie('password') + getCookie('usrID')));
	resourceURL = CryptoJS.enc.Utf8.stringify(resourceURL);
	initialize ();
}

function logout () {
	document.cookie = "usrID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
	window.location.href = 'login.html';
}