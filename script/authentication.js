// JavaScript Document

var resourceURL = '';
var key = '';
var keyPairId = '';
var permittedEPs = [];

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
			window.location.href = redirect('login.html');
	} else {
		if (currentPage == 'login')
			window.location.href = redirect('index.html');
		else {
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					setPermission (xml, index, this.responseXML);
				}
			};
			xhttp.open("GET", "xml/series.xml", true);
			xhttp.send();
		}
	}
}

function setPermission (usrXML, usrIndex, seriesXML) {
	var usrNode = usrXML.getElementsByTagName('user')[usrIndex];
	var usrPermission = usrNode.getElementsByTagName('permission')[0];
	var includeEPs = usrPermission.getElementsByTagName('include')[0].getElementsByTagName('ep');
	var includeTags = usrPermission.getElementsByTagName('include')[0].getElementsByTagName('tag');
	var includeSeries = usrPermission.getElementsByTagName('include')[0].getElementsByTagName('series');
	var excludeSeries = usrPermission.getElementsByTagName('exclude')[0].getElementsByTagName('series');

	var i = 0;
	var allEPs = seriesXML.querySelectorAll('video, image, audio');
	
	if (includeEPs.length == 0 && includeTags.length == 0 && includeSeries.length == 0) {
		for (i = 0; i < allEPs.length; i++) {
			permittedEPs.push (allEPs[i].childNodes[0].nodeValue);
		}
	}
	
	if (includeEPs.length != 0) {
		for (i = 0; i < includeEPs.length; i++) {
			if (!permittedEPs.includes(includeEPs[i].childNodes[0].nodeValue))
				permittedEPs.push (includeEPs[i].childNodes[0].nodeValue);
		}
	}
	
	if (includeTags != 0) {
		let includeTags_string = [];
		for (i = 0; i < includeTags.length; i++) {
			includeTags_string.push(includeTags[i].childNodes[0].nodeValue);
		}
		for (i = 0; i < allEPs.length; i++) {
			if (includeTags_string.includes(allEPs[i].getAttribute('tag').split(' ')[0]) && !permittedEPs.includes(allEPs[i].childNodes[0].nodeValue))
				permittedEPs.push(allEPs[i].childNodes[0].nodeValue);
		}
	}
	
	if (includeSeries.length != 0) {
		let parentNodes = [];
		let includeSeries_string = [];
		for (i = 0; i < includeSeries.length; i++) {
			includeSeries_string.push(includeSeries[i].childNodes[0].nodeValue);
		}
		for (i = 0; i < allEPs.length; i++) {
			if (includeSeries_string.includes(allEPs[i].childNodes[0].nodeValue) && !parentNodes.includes(allEPs[i].parentNode))
				parentNodes.push(allEPs[i].parentNode);
		}
		for (i = 0; i < parentNodes.length; i++) {
			let childNodes = parentNodes[i].querySelectorAll('video, image, audio');
			for (let j = 0; j < childNodes.length; j++) {
				if (!permittedEPs.includes(childNodes[j].childNodes[0].nodeValue))
					permittedEPs.push (childNodes[j].childNodes[0].nodeValue);
			}
		}
	}
	
	if (excludeSeries.length != 0) {
		let parentNodes = [];
		let excludeSeries_string = [];
		for (i = 0; i < excludeSeries.length; i++) {
			excludeSeries_string.push(excludeSeries[i].childNodes[0].nodeValue);
		}
		for (i = 0; i < allEPs.length; i++) {
			if (excludeSeries_string.includes(allEPs[i].childNodes[0].nodeValue) && !parentNodes.includes(allEPs[i].parentNode))
				parentNodes.push(allEPs[i].parentNode);
		}
		for (i = 0; i < parentNodes.length; i++) {
			let childNodes = parentNodes[i].querySelectorAll('video, image, audio');
			for (let j = 0; j < childNodes.length; j++) {
				if (permittedEPs.includes(childNodes[j].childNodes[0].nodeValue))
					permittedEPs.splice(permittedEPs.indexOf(childNodes[j].childNodes[0].nodeValue), 1);
			}
		}
	}
	
	var AESKey = SHA256 (getCookie('username') + getCookie('password') + getCookie('usrID'));
	
	resourceURL = usrNode.getElementsByTagName('url')[0].childNodes[0].nodeValue;
	resourceURL = decryptAES (resourceURL, AESKey);
	resourceURL = CryptoJS.enc.Utf8.stringify(resourceURL);
	
	key = usrNode.getElementsByTagName('key')[0].childNodes[0].nodeValue;
	key = decryptAES (key, AESKey);
	key = CryptoJS.enc.Utf8.stringify(key);
	
	keyPairId = usrNode.getElementsByTagName('keyPairId')[0].childNodes[0].nodeValue;
	keyPairId = decryptAES (keyPairId, AESKey);
	keyPairId = CryptoJS.enc.Utf8.stringify(keyPairId);
	
	initialize ();
}

function logout () {
	document.cookie = "usrID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
	window.location.href = 'login.html';
}