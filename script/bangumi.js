// JavaScript Document
var EP;
var series;
var EPNode;
var fileNode;
var timeout = 0;
var validDuration = 5*60*60*1000;

function initialize () {
	EP = getURLParam ('ep');
	if (EP == null) {
		window.location.href = 'index.html';
		return 0;
	}
	
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			getSeries(this.responseXML);
			updatePage ();
		}
	};
	xhttp.open("GET", "xml/series.xml", true);
	xhttp.send();
}

function getSeries (xml) {
	var EPs = xml.querySelectorAll('video, image, audio');
	for (var i = 0; i < EPs.length; i++) {
		if (EPs[i].childNodes[0].nodeValue == EP){
			series = EPs[i].parentNode;
			EPNode = EPs[i];
			break;
		}
	}
}

function updatePage () {
	var type = EPNode.tagName;
	
	document.getElementById('title').innerHTML =  series.getAttribute("title") + ' [' + EPNode.getAttribute('tag') + '] ';
	document.title = series.getAttribute("title") + ' [' + EPNode.getAttribute('tag') + '] | ど〜ん〜！ば〜ん〜！！';
	
	var EPs = filterEP ();
	
	var epButtonWrapper = document.createElement('div');
	epButtonWrapper.id = 'ep-button-wrapper';
	for (var i = 0; i < EPs.length; i++) {
		var epButton = document.createElement('div');
		var epText = document.createElement('p');
		
		let tempEP = EPs[i].childNodes[0].nodeValue;
		epText.innerHTML = EPs[i].getAttribute('tag');
		
		epButton.appendChild(epText);
		epButton.addEventListener('click', function () {goToEP(tempEP);});
		
		epButtonWrapper.appendChild(epButton);
	}
	
	document.getElementById('ep-selector').appendChild(epButtonWrapper);
	
	if (document.getElementById('ep-button-wrapper').clientHeight/window.innerHeight > 0.50) {
		var showMoreButton = document.createElement('p');
		showMoreButton.id = 'show-more-button';
		showMoreButton.innerHTML = 'すべてを見る &#xE972;';
		showMoreButton.onclick = function () {toggleEpSelector ();};
		
		document.getElementById('ep-selector').appendChild(showMoreButton);
		document.getElementById('ep-button-wrapper').style.maxHeight = '50vh';
	}
	
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			fileNode = this.responseXML;
			if (type == 'video') {
				updateVideo ();
			} else if (type == 'audio') {
				updateAudio ();
			} else {
				updateImage ();
			}
		}
	};
	xhttp.open('GET', 'xml/ep/' + EP + '.xml', true);
	xhttp.send();
}

function updateVideo () {
	var formats = fileNode.getElementsByTagName('format');
	var fileName = fileNode.getElementsByTagName('fileName')[0].childNodes[0].nodeValue;
	
	var formatSelector = document.createElement('div');
	formatSelector.setAttribute('id', 'format-selector');
	
	var selectMenu = document.createElement('select');
	selectMenu.addEventListener("change", formatSwitch);
	
	for (var i = 0; i < formats.length; i++) {
		var format = formats[i].childNodes[0].nodeValue;
		var option = document.createElement('option');
		
		option.setAttribute('value', format);
		option.innerHTML = format;
		
		if (i == 0) {
			option.setAttribute('selected', true);
		}
		
		selectMenu.appendChild (option);
	}
	
	formatSelector.appendChild(selectMenu);
	document.getElementById('media-holder').appendChild(formatSelector);
	
	var videoNode = document.createElement('video');
	var videoSrc = document.createElement('source');
	videoNode.setAttribute('controls', true);
	//videoNode.setAttribute('preload', 'metadata');
	
	var url = generateURL (resourceURL + EP + '/' + encodeURI(fileName + '[' + formats[0].childNodes[0].nodeValue + '].mp4'));
		
	//videoSrc.setAttribute('src', resourceURL + EP + '/' + encodeURI(fileName + '[' + formats[0].childNodes[0].nodeValue + '].mp4'));
	videoSrc.setAttribute('src', url);
	videoSrc.setAttribute('type', "video/mp4");
	videoNode.appendChild(videoSrc);
	document.getElementById('media-holder').appendChild(videoNode);
}

function updateAudio () {
	var files = fileNode.getElementsByTagName('fileName');
	
	for (var i = 0; i < files.length; i++) {
		var audioNode = document.createElement('audio');
		var audioSrc = document.createElement('source');
		var subtitle = document.createElement('p');
		
		let url = generateURL (resourceURL + EP + '/' + encodeURI(files[i].childNodes[0].nodeValue));
		
		//audioSrc.setAttribute('src', resourceURL + EP + '/' + encodeURI(files[i].childNodes[0].nodeValue));
		audioSrc.setAttribute('src', url);
		audioSrc.setAttribute('type', 'audio/mp4');
		audioNode.appendChild(audioSrc);
		audioNode.setAttribute('controls', true);
		//audioNode.setAttribute('preload', 'metadata');
		subtitle.setAttribute('class', 'sub-title');
		subtitle.innerHTML = files[i].getAttribute("tag");
		document.getElementById('media-holder').appendChild(subtitle);
		document.getElementById('media-holder').appendChild(audioNode);
	}
}

function updateImage () {
	var groups = fileNode.getElementsByTagName('group');
	
	for (var i = 0; i < groups.length; i++) {
		var subtitle = document.createElement('p');
		subtitle.setAttribute('class', 'sub-title');
		subtitle.innerHTML = groups[i].getAttribute("tag");
		document.getElementById('media-holder').appendChild(subtitle);
		var files = groups[i].getElementsByTagName('fileName');
		for (var j = 0; j < files.length; j++) {
			var imageNode = document.createElement('img');
			let file = files[j];
			
			let url = generateURL (resourceURL + EP + '/' + encodeURI(file.childNodes[0].nodeValue));
			
			//imageNode.setAttribute('src', resourceURL + EP + '/' + encodeURI(file.childNodes[0].nodeValue));
			imageNode.setAttribute('src', url);
			imageNode.setAttribute('alt', files[j].childNodes[0].nodeValue);
			imageNode.onclick = function () {window.location.href = url};
			document.getElementById('media-holder').appendChild(imageNode);
		}
	}
}

function formatSwitch () {
	var format = document.getElementById('format-selector').getElementsByTagName('select')[0].value;
	var videoNode = document.getElementById('media-holder').getElementsByTagName('video')[0];
	var videoSrc = document.createElement('source');
	
	var url = generateURL (resourceURL + EP + '/' + encodeURI(fileNode.getElementsByTagName('fileName')[0].childNodes[0].nodeValue + '[' + format + '].mp4'));
	
	videoSrc.setAttribute('src', url);
	videoSrc.setAttribute('type', "video/mp4");
	videoNode.innerHTML='';
	videoNode.appendChild(videoSrc);
	videoNode.load();
}

function goToEP (dest_ep) {
	var url = 'bangumi.html?ep=' + dest_ep;
	window.location.href = url;
}

function filterEP () {
	var EPs = series.querySelectorAll('video, image, audio');
	var result = [];
	
	for (var i = 0; i < EPs.length; i++) {
		if (permittedEPs.includes(EPs[i].childNodes[0].nodeValue))
			result.push (EPs[i]);
	}
	
	if (!result.includes(EPNode)) {
		alert ("You do not have permission to access this page.");
		window.location.href = 'index.html';
		return 0;
	}
	return result;
}

function toggleEpSelector () {
	let expanded = document.getElementById('ep-button-wrapper').style.maxHeight=='none';
	document.getElementById('ep-button-wrapper').style.maxHeight = expanded ? '50vh' : 'none';
	document.getElementById('ep-button-wrapper').style.overflowY = expanded ? 'hidden' : 'visible';
	document.getElementById('show-more-button').innerHTML = expanded ? 'すべてを見る &#xE972;' : '非表示にする &#xE971;';
	document.getElementById('show-more-button').style.margin = expanded ? 'calc(-4em - 34px) 0px 0px' : '-34px 0px 0px 0px';
	document.getElementById('show-more-button').style.padding = expanded ? '2em 0px 34px' : '0px 0px 34px';
	document.getElementById('show-more-button').style.background = expanded ? 'linear-gradient(to bottom, rgba(253,253,253,0) 0%,rgba(253,253,253,1) 2em)' : 'none';
}

function createSignature (url, time) {
	var policy = '{"Statement":[{"Resource":"' + url + '","Condition":{"DateLessThan":{"AWS:EpochTime":' + time + '}}}]}';
	
	var signature = new KJUR.crypto.Signature({"alg": "SHA1withRSA"});
	signature.init(key);
	signature.updateString(policy);
	signature = signature.sign();
	signature = CryptoJS.enc.Hex.parse (signature);
	signature = CryptoJS.enc.Base64.stringify(signature);
	signature = signature.replace(/\+/g, '-');
	signature = signature.replace(/=/g, '_');
	signature = signature.replace(/\//g, '~');
	return signature;
}

function generateURL (url) {
	var time = new Date();
	time.setTime(time.getTime() + (validDuration));
	setAlert ();
	time = Math.round(time.getTime() / 1000);
	
	url = url + '?Expires=' + time + '&Signature=' + createSignature(url, time) + '&Key-Pair-Id=' + keyPairId;
	
	return url;
}

function setAlert () {
	if (timeout != 0) {
		clearTimeout(timeout);
	}
	
	timeout = setTimeout (function () {
		alert('Session expired. Returning to home page.');
		window.location.href = 'index.html';
	}, validDuration);
}