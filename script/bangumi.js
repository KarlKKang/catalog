// JavaScript Document
var id;
var series;
var idNode;
var fileNode;

function initialize () {
	id = getURLParam ('ep');
	if (id == null) {
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
	var ids = xml.querySelectorAll('video, image, audio');
	for (var i = 0; i < ids.length; i++) {
		if (ids[i].childNodes[0].nodeValue == id){
			series = ids[i].parentNode;
			idNode = ids[i];
			break;
		}
	}
}

function updatePage () {
	var type = idNode.tagName;
	
	document.getElementById('title').innerHTML =  series.getAttribute("title") + ' [' + idNode.getAttribute('tag') + '] ';
	document.title = series.getAttribute("title") + ' [' + idNode.getAttribute('tag') + '] | ど〜ん〜！ば〜ん〜！！';
	
	var eps = filterEP ();
	
	var epButtonWrapper = document.createElement('div');
	epButtonWrapper.id = 'ep-button-wrapper';
	for (var i = 0; i < eps.length; i++) {
		var epButton = document.createElement('div');
		var epText = document.createElement('p');
		
		let tempID = eps[i].childNodes[0].nodeValue;
		epText.innerHTML = eps[i].getAttribute('tag');
		
		epButton.appendChild(epText);
		epButton.addEventListener('click', function () {goToID(tempID);});
		
		epButtonWrapper.appendChild(epButton);
	}
	
	document.getElementById('ep-selector').appendChild(epButtonWrapper);
	
	if (document.getElementById('ep-button-wrapper').clientHeight/window.innerHeight > 0.50) {
		var showMoreButton = document.createElement('p');
		showMoreButton.id = 'show-more-button';
		showMoreButton.innerHTML = 'すべてを見る';
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
	xhttp.open('GET', 'xml/ep/' + id + '.xml', true);
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
	
	videoSrc.setAttribute('src', resourceURL + id + '/' + encodeURI(fileName + '[' + formats[0].childNodes[0].nodeValue + '].mp4'));
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
		audioSrc.setAttribute('src', resourceURL + id + '/' + encodeURI(files[i].childNodes[0].nodeValue));
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
			imageNode.setAttribute('src', resourceURL + id + '/' + encodeURI(file.childNodes[0].nodeValue));
			imageNode.setAttribute('alt', files[j].childNodes[0].nodeValue);
			imageNode.onclick = function () {window.location.href = resourceURL + id + '/' + encodeURI(file.childNodes[0].nodeValue)};
			document.getElementById('media-holder').appendChild(imageNode);
		}
	}
}

function formatSwitch () {
	var format = document.getElementById('format-selector').getElementsByTagName('select')[0].value;
	var videoNode = document.getElementById('media-holder').getElementsByTagName('video')[0];
	var videoSrc = document.createElement('source');
	
	videoSrc.setAttribute('src', resourceURL + id + '/' + encodeURI(fileNode.getElementsByTagName('fileName')[0].childNodes[0].nodeValue + '[' + format + '].mp4'));
	videoSrc.setAttribute('type', "video/mp4");
	videoNode.innerHTML='';
	videoNode.appendChild(videoSrc);
	videoNode.load();
}

function goToID (id) {
	var url = 'bangumi.html?ep=' + id;
	window.location.href = url;
}

function filterEP () {
	var eps = series.querySelectorAll(permittedType);
	var result = [];
	var i = 0;
	
	if (permittedID.length == 0) {
		for (i = 0; i < eps.length; i++){
			result.push(eps[i]);
		}
	} else {
		for (i = 0; i < eps.length; i++){
			if (permittedID.includes(eps[i].childNodes[0].nodeValue)) {
				result.push(eps[i]);
			}
		}
	}
	
	if (!result.includes(idNode)) {
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
	document.getElementById('show-more-button').innerHTML = expanded ? 'すべてを見る' : '非表示にする';
	document.getElementById('show-more-button').style.margin = expanded ? 'calc(-4em - 34px) 0px 0px' : '-34px 0px 0px 0px';
	document.getElementById('show-more-button').style.padding = expanded ? '2em 0px 34px' : '0px 0px 34px';
	document.getElementById('show-more-button').style.background = expanded ? 'linear-gradient(to bottom, rgba(253,253,253,0) 0%,rgba(253,253,253,1) 2em)' : 'none';
}