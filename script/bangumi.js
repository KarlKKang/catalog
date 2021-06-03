// JavaScript Document
var EP;
var series;
var EPNode;
var fileNode;
var chapters = {name: [], startTime: []};
var videoJSInstances = [];

var XHROpen;

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
			XHROpen = XMLHttpRequest.prototype.open;
			XMLHttpRequest.prototype.open = XHROverride;
			updatePage (this.responseXML);
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

function filterSeries (xml) {
	var EPs = xml.querySelectorAll('video, image, audio');
	var result = [];
	
	for (var i = 0; i < EPs.length; i++) {
		if (permittedEPs.includes(EPs[i].childNodes[0].nodeValue) && !result.includes(EPs[i].parentNode))
			result.push(EPs[i].parentNode);
	}
	return result;
}

function firstAvailableEP (targetSeries) {
	var EPs = targetSeries.querySelectorAll('video, image, audio');
	for (var i = 0; i < EPs.length; i++) {
		if (permittedEPs.includes(EPs[i].childNodes[0].nodeValue)) {
			return EPs[i].childNodes[0].nodeValue;
		}
	}
}

function updatePage (xml) {
	var type = EPNode.tagName;
	var title =  ((EPNode.getAttribute('title')==null)?series.getAttribute('title'):EPNode.getAttribute('title'));
	
	document.getElementById('title').innerHTML =  title;
	document.title = title + ' | ど〜ん〜！ば〜ん〜！！';
	
	var EPs = filterEP ();
	
	/////////////////////////////////////////////EP Selector/////////////////////////////////////////////
	var epButtonWrapper = document.createElement('div');
	epButtonWrapper.id = 'ep-button-wrapper';
	for (var i = 0; i < EPs.length; i++) {
		let epButton = document.createElement('div');
		let epText = document.createElement('p');
		
		let targetEP = EPs[i].childNodes[0].nodeValue;
		epText.innerHTML = EPs[i].getAttribute('tag');
		
		if (EPs[i].getAttribute('tag') == EPNode.getAttribute('tag')) {
			epButton.style.fontWeight = 'bolder';
			epButton.style.textDecoration = 'underline';
		}
		
		epButton.appendChild(epText);
		epButton.addEventListener('click', function () {goToEP(targetEP);});
		
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
	
	/////////////////////////////////////////////Season Selector/////////////////////////////////////////////
	var seasonButtonWrapper = document.createElement('div');
	seasonButtonWrapper.id = 'season-button-wrapper';
	
	var group = series.getAttribute('group');
	var groupOrder = series.getAttribute('group-order');
	var allSeasons = [];
	var seasonOrders = [];
	var allSeries = filterSeries (xml);
	
	for (i = 0; i < allSeries.length; i++) {
		if (allSeries[i].getAttribute('group') == group && allSeries[i].getAttribute('group-order') != groupOrder) {
			allSeasons.push (allSeries[i]);
			seasonOrders.push (parseInt(allSeries[i].getAttribute('group-order')));
		}
	}
	
	if (allSeasons.length != 0) {
		for (i = 0; i <= allSeasons.length; i++) {
			let index = seasonOrders.indexOf(i+1);
			
			let seasonButton = document.createElement('div');
			let seasonText = document.createElement('p');
			
			if (index != -1) {
				seasonText.innerHTML = allSeasons[index].getAttribute('season-name');
				seasonButton.appendChild (seasonText);
				let targetEP = firstAvailableEP (allSeasons[index]);
				seasonButton.addEventListener('click', function () {goToEP(targetEP);});
			} else {
				seasonText.innerHTML = series.getAttribute('season-name');
				seasonButton.appendChild (seasonText);
				seasonButton.classList.add ('current-season');
			}
			seasonButtonWrapper.appendChild (seasonButton);
		}
		document.getElementById('season-selector').appendChild(seasonButtonWrapper);
	} else {
		document.getElementById('season-selector').style.display = 'none';
	}
	
	/////////////////////////////////////////////Add Media/////////////////////////////////////////////
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			fileNode = this.responseXML;
			if (type == 'video') {
				updateVideo ();
			} else if (type == 'audio') {
				updateAudio_videojs ();
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
	
	//var videoNode = addVideoNode (fileName, formats[0].childNodes[0].nodeValue);
	addVideoJSNode (fileName, formats[0].childNodes[0].nodeValue);
	videoJSInstances.load();
}

function updateAudio_videojs () {
	var files = fileNode.getElementsByTagName('fileName');
	
	if (fileNode.getElementsByTagName('album-title').length!=0) {
		let albumTitle = document.createElement('p');
		albumTitle.setAttribute('class', 'sub-title');
		albumTitle.style.textAlign = 'center';
		albumTitle.innerHTML = fileNode.getElementsByTagName('album-title')[0].childNodes[0].nodeValue;
		document.getElementById('media-holder').appendChild(albumTitle);
		if (fileNode.getElementsByTagName('album-artist').length!=0) {
			let albumArtist = document.createElement('p');
			albumArtist.setAttribute('class', 'artist');
			albumArtist.style.textAlign = 'center';
			albumArtist.innerHTML = fileNode.getElementsByTagName('album-artist')[0].childNodes[0].nodeValue;
			document.getElementById('media-holder').appendChild(albumArtist);
		}
	}
	
	var config = {
		controls: true,
		autoplay: false,
		preload: 'auto',
		fluid: true,
		aspectRatio: "1:0",
		controlBar: {
			fullscreenToggle: false,
			pictureInPictureToggle: false
		},
		html5: {
			vhs: {
				overrideNative: true
			},
			nativeAudioTracks: false,
			nativeVideoTracks: false
		}
	};
	
	for (var i = 0; i < files.length; i++) {
		let audioNode = document.createElement('audio');
		let subtitle = document.createElement('p');
		
		audioNode.id = "track"+i;
		
		document.getElementById('media-holder').appendChild(subtitle);
		document.getElementById('media-holder').appendChild(audioNode);
		
		let url = resourceURL + EP + '/' + encodeURI('_MASTER_' + files[i].childNodes[0].nodeValue + '.m3u8');
		
		audioNode.classList.add("vjs-default-skin");
		audioNode.classList.add("video-js");
		let audio = videojs(audioNode, config);
		videoJSInstances.push(audio);
		
		if (Hls.isSupported()) {
			audio.src({
				src: generateURL (url, '', 5000),
				type: 'application/x-mpegURL'
			});
		} else {
			audio.src({
				src: generateURL (url, '?ios=true', 5000),
				type: 'application/x-mpegURL'
			});
		}
		
		audio.volume(1);
		
		subtitle.setAttribute('class', 'sub-title');
		subtitle.innerHTML = files[i].getAttribute('tag');
		
		audio.on("play", function () {
			for (var i = 0; i < videoJSInstances.length; i++) {
				if (this.id() != videoJSInstances[i].id()) {
					videoJSInstances[i].pause();
				}
			}
		});
		audio.on("ended", function () {
			//var tracks = document.getElementById('media-holder').getElementsByClassName('video-js');
			if (this.id() != "track"+(videoJSInstances.length-1)) {
				videoJSInstances[parseInt(this.id().slice(5))+1].play();
			}
		});
		audioNode.parentElement.addEventListener('contextmenu', event => event.preventDefault());
		
		if (files[i].getAttribute('artist')!=null) {
			let artist = document.createElement('span');
			artist.setAttribute('class', 'artist');
			artist.innerHTML = '／' + files[i].getAttribute('artist');
			subtitle.appendChild(artist);
		}
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
			
			let url = generateURL (resourceURL + EP + '/' + encodeURI(file.childNodes[0].nodeValue), '', 5000);
			
			imageNode.setAttribute('src', url);
			imageNode.setAttribute('alt', files[j].childNodes[0].nodeValue);
			imageNode.onclick = function () {window.location.href = generateURL (resourceURL + EP + '/' + encodeURI(file.childNodes[0].nodeValue), '', 5000);};
			imageNode.addEventListener('contextmenu', event => event.preventDefault());
			document.getElementById('media-holder').appendChild(imageNode);
		}
	}
}

function formatSwitch () {
	var format = document.getElementById('format-selector').getElementsByTagName('select')[0].value;
	//var videoNode = document.getElementById('media-holder').getElementsByTagName('video')[0];
	var currentTime = videoJSInstances.currentTime();
	var paused = videoJSInstances.paused();
	
	addVideoJSNode (fileNode.getElementsByTagName('fileName')[0].childNodes[0].nodeValue, format);
	
	var resume = function () {
		videoJSInstances.currentTime(currentTime);
		if (!paused)
			videoJSInstances.play();
		videoJSInstances.off ('loadeddata', resume);
	};
	
	videoJSInstances.load();
	videoJSInstances.on ('loadeddata', resume);
}

function addVideoJSNode (fileName, format) {
	if (document.getElementById('media-holder').getElementsByTagName('video-js').length != 0) {
		document.getElementById('media-holder').getElementsByTagName('video-js')[0].remove();
	}
	if (document.getElementById('media-holder').getElementsByClassName('chapters').length != 0) {
		document.getElementById('media-holder').getElementsByClassName('chapters')[0].remove();
	}
	
	var videoNode = document.createElement('video-js');
	videoNode.classList.add('vjs-big-play-centered');
	
	var url = resourceURL + EP + '/' + encodeURI('_MASTER_' + fileName + '[' + format + '].m3u8');
	
	videoNode.addEventListener('contextmenu', event => event.preventDefault());
	document.getElementById('media-holder').appendChild(videoNode);
	
	var config = {
		controls: true,
		autoplay: false,
		preload: 'auto',
		fluid: true,
		playsinline: true,
		html5: {
			vhs: {
				overrideNative: true
			},
			nativeAudioTracks: false,
			nativeVideoTracks: false
		}
	};
	var video = videojs(videoNode, config);
	videoJSInstances = video;
	if (Hls.isSupported()) {
		video.src({
			src: generateURL (url, '', 5000),
			type: 'application/x-mpegURL'
		});
	} else {
		video.src({
			src: generateURL (url, '?ios=true', 5000),
			type: 'application/x-mpegURL'
		});
	}
	
	video.volume(1);
	
	video.ready(function() {
		this.hotkeys({
			volumeUpKey: function(event, player) {
				return false;
			},
			volumeDownKey: function(event, player) {
				return false;
			},
			seekStep: 5,
			enableVolumeScroll: false,
			enableModifiersForNumbers: false
		});
	});
	//videojs.Vhs.GOAL_BUFFER_LENGTH = 30*60;
	//videojs.Vhs.MAX_GOAL_BUFFER_LENGTH = 2*60*60;
	//videojs.Vhs.GOAL_BUFFER_LENGTH_RATE = 1,
	
	videoNode.getElementsByTagName('video')[0];
	if (Hls.isSupported()) {
		videoJSInstances.on ('play', buffering);
		videoJSInstances.on ('seeked', function () {
			var paused = video.paused();
			video.pause();
			if (!paused)
				video.play();
		});
	}
	
	if (fileNode.getElementsByTagName('chapters').length != 0) {
		if (fileNode.getElementsByTagName('chapters')[0].childNodes[0].nodeValue == 'true') {
			getChapters ();
		}
	}
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
		alert ('You do not have permission to access this page.');
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

function generateURL (url, query, validDuration) {
	var time = new Date();
	time.setTime(time.getTime() + validDuration);
	time = Math.round(time.getTime() / 1000);
	
	url = url + query;
	
	url = url + ((query=='')?'?':'&') + 'Expires=' + time + '&Signature=' + createSignature(url, time) + '&Key-Pair-Id=' + keyPairId;
	
	return url;
}

function XHROverride () {
	if (arguments[1].endsWith('.ts') || arguments[1].endsWith('.key') || arguments[1].endsWith('.m3u8')){
		arguments[1] = generateURL (arguments[1], '', 5000);
	}
	XHROpen.apply(this, arguments);
}

function addAccordionEvent () {
	var acc = document.getElementsByClassName("accordion");
	var i;

	for (i = 0; i < acc.length; i++) {
		acc[i].addEventListener("click", function() {
			this.classList.toggle("active");
			var panel = this.nextElementSibling;
			if (panel.style.maxHeight) {
				panel.style.maxHeight = null;
			} else {
				panel.style.maxHeight = panel.scrollHeight + "px";
			}
		});
	}
}

function getChapters () {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			let xml = this.responseXML;
			let ChapterString = xml.querySelectorAll('ChapterString');
			let ChapterTimeStart = xml.querySelectorAll('ChapterTimeStart');
			
			chapters = {name: [], startTime: []};
			for (var i = 0; i < ChapterString.length; i++) {
				chapters.name.push(ChapterString[i].childNodes[0].nodeValue);
				let timestamp = ChapterTimeStart[i].childNodes[0].nodeValue.split(":");
				let startTime = parseInt (timestamp[0]) * 60 * 60 + parseInt (timestamp[1]) * 60 + parseFloat (timestamp[2]);
				//startTime = Math.round(startTime*1000)/1000;
				chapters.startTime.push(startTime);
			}
			displayChapters ();
		}
	};
	xhttp.open("GET", generateURL(resourceURL + EP + '/chapters.xml', '', 5000), true);
	xhttp.send();
}

function displayChapters () {
	var chapterLength = chapters.name.length;
	
	var accordion = document.createElement('button');
	accordion.classList.add('accordion');
	accordion.innerHTML = 'CHAPTERS';
	
	var accordionPanel = document.createElement('div');
	accordionPanel.classList.add('panel');
	
	for (var i = 0; i < chapterLength; i++) {
		let chapter = document.createElement('p');
		let timestamp = document.createElement('span');
		let cueText = document.createTextNode('\xa0\xa0' + chapters.name[i]);
		let startTime = chapters.startTime[i];
		timestamp.innerHTML = secToTimestamp (startTime);
		timestamp.onclick = function () {
			videoJSInstances.currentTime(startTime);
			videoJSInstances.play();
		};
		chapter.appendChild(timestamp);
		chapter.appendChild(cueText);
		chapter.className = 'inactive-chapter';
		accordionPanel.appendChild(chapter);
	}
	
	var chaptersNode = document.createElement('div');
	chaptersNode.classList.add('chapters');
	chaptersNode.appendChild(accordion);
	chaptersNode.appendChild(accordionPanel);
	document.getElementById('media-holder').appendChild(chaptersNode);
	addAccordionEvent ();
	
	var updateChapterDisplay = function () {
		var chapterElements = accordionPanel.getElementsByTagName('p');
		var currentTime = videoJSInstances.currentTime();
		for (var i = 0; i < chapterLength; i++) {
			if (currentTime >= chapters.startTime[i]) {
				if (i == chapterLength-1) {
					chapterElements[i].className = 'current-chapter';
				} else if (currentTime < chapters.startTime[i+1]) {
					chapterElements[i].className = 'current-chapter';  
				} else {
					chapterElements[i].className = 'inactive-chapter';
				}
			} else {
				chapterElements[i].className = 'inactive-chapter';
			}
		}
	};
	
	videoJSInstances.on ('timeupdate', updateChapterDisplay);
	videoJSInstances.on ('play', updateChapterDisplay);
	videoJSInstances.on ('pause', updateChapterDisplay);
	videoJSInstances.on ('seeking', updateChapterDisplay);
}

function secToTimestamp (sec) {
	var hour = Math.floor(sec/60/60);
	sec = sec - hour*60*60;
	var min = Math.floor(sec/60);
	sec = sec - min*60;

	sec = Math.round(sec);
	if (sec < 10) {
		sec = '0' + sec;
	}
	
	if (hour > 0 && min < 10) {
		min = '0' + min;
	}
	
	return ((hour==0)?'':(hour + ':')) + min + ':' + sec;
}

function buffering () {
	function addCheckBuffer () {
		if (videoJSInstances.currentTime() > 0 && !videoJSInstances.paused() && !videoJSInstances.ended() && videoJSInstances.readyState() > 2) {
			videoJSInstances.pause();
		}
		document.getElementById('media-holder').getElementsByClassName('video-js')[0].classList.add('vjs-seeking');
		videoJSInstances.off ('play', buffering);
		videoJSInstances.on ('play', checkBuffer);
		videoJSInstances.on ('progress', checkBuffer);
		videoJSInstances.on ('timeupdate', checkBuffer);
	}
	
	if (videoJSInstances.buffered().length == 0) {
		addCheckBuffer ();
	} else {
		for (var i = 0; i < videoJSInstances.buffered().length; i++) {
			if (videoJSInstances.buffered().start(videoJSInstances.buffered().length - 1 - i) - 0.25 <= videoJSInstances.currentTime()) {
				if (videoJSInstances.buffered().end(videoJSInstances.buffered().length - 1 - i) < Math.min(videoJSInstances.currentTime()+15, videoJSInstances.duration())) {
					addCheckBuffer ();
				}
				break;
			}
		}
	}
}

function checkBuffer () {
	if (videoJSInstances.currentTime() > 0 && !videoJSInstances.paused() && !videoJSInstances.ended() && videoJSInstances.readyState() > 2) {
		videoJSInstances.pause();
	}
	document.getElementById('media-holder').getElementsByClassName('video-js')[0].classList.add('vjs-seeking');
	
	for (var i = 0; i < videoJSInstances.buffered().length; i++) {
		if (videoJSInstances.buffered().start(videoJSInstances.buffered().length - 1 - i) - 0.25 <= videoJSInstances.currentTime() && videoJSInstances.buffered().end(videoJSInstances.buffered().length - 1 - i) >= videoJSInstances.currentTime()) {
			if (videoJSInstances.buffered().end(videoJSInstances.buffered().length - 1 - i) >= Math.min(videoJSInstances.currentTime()+15, videoJSInstances.duration())) {
				document.getElementById('media-holder').getElementsByClassName('video-js')[0].classList.remove('vjs-seeking');
				videoJSInstances.off ('play', checkBuffer);
				videoJSInstances.off ('progress', checkBuffer);
				videoJSInstances.off ('timeupdate', checkBuffer);
				let playPromise = videoJSInstances.play();
				if (playPromise !== undefined) {
					playPromise.then(_ => {
						videoJSInstances.on ('play', buffering);
					});
				}
				
				break;	
			}
		}
	}
}