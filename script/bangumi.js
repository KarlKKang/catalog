// JavaScript Document
var EP;
var series;
var EPNode;
var fileNode;
var timeout = 0;

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
	var title = series.getAttribute('title') + ' [' + EPNode.getAttribute('tag') + ']' + ((EPNode.getAttribute('title')==null)?'':(' - ' + EPNode.getAttribute('title')));
	
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
	
	var loadingText = document.createElement('p');
	loadingText.setAttribute('id', 'loading-text');
	loadingText.innerHTML = '動画を読み込んでいます。しばらくお待ちください。';
	loadingText.style.display = 'none';
	document.getElementById('media-holder').appendChild(loadingText);
	
	var videoNode = addVideoNode (fileName, formats[0].childNodes[0].nodeValue);
	videoNode.load();
}

function updateAudio () {
	var files = fileNode.getElementsByTagName('fileName');
	
	for (var i = 0; i < files.length; i++) {
		var audioNode = document.createElement('audio');
		var subtitle = document.createElement('p');
		
		let url = resourceURL + EP + '/' + encodeURI('_MASTER_' + files[i].childNodes[0].nodeValue + '.m3u8');
		
		setHLS (audioNode, url);
		
		audioNode.setAttribute('controls', true);
		audioNode.setAttribute('controlsList', 'nodownload');
		subtitle.setAttribute('class', 'sub-title');
		subtitle.innerHTML = files[i].getAttribute("tag");
		audioNode.addEventListener('contextmenu', event => event.preventDefault());
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
	var videoNode = document.getElementById('media-holder').getElementsByTagName('video')[0];
	var currentTime = videoNode.currentTime;
	var paused = videoNode.paused;
	
	videoNode = addVideoNode (fileNode.getElementsByTagName('fileName')[0].childNodes[0].nodeValue, format);
	
	var resume = function () {
		videoNode.currentTime = currentTime;
		if (!paused)
			videoNode.play();
		videoNode.removeEventListener ('loadeddata', resume);
	};
	
	videoNode.load();
	videoNode.addEventListener ('loadeddata', resume);
}

function addVideoNode (fileName, format) {
	if (document.getElementById('media-holder').getElementsByTagName('video').length != 0) {
		document.getElementById('media-holder').getElementsByTagName('video')[0].remove();
	}
	if (document.getElementById('media-holder').getElementsByClassName('chapters').length != 0) {
		document.getElementById('media-holder').getElementsByClassName('chapters')[0].remove();
	}
	
	var videoNode = document.createElement('video');
	videoNode.setAttribute('controls', true);
	videoNode.setAttribute('controlsList', 'nodownload');
	videoNode.setAttribute('preload', 'auto');
	
	if (Hls.isSupported()) {
		videoNode.addEventListener ('play', buffering);
		videoNode.addEventListener ('seeked', function () {
			var paused = videoNode.paused;
			videoNode.pause();
			if (!paused)
				videoNode.play();
		});
	}
	
	var url = resourceURL + EP + '/' + encodeURI('_MASTER_' + fileName + '[' + format + '].m3u8');
	
	setHLS (videoNode, url);
	
	videoNode.addEventListener('contextmenu', event => event.preventDefault());
	document.getElementById('media-holder').appendChild(videoNode);
	
	if (fileNode.getElementsByTagName('chapters').length != 0) {
		if (fileNode.getElementsByTagName('chapters')[0].childNodes[0].nodeValue == 'true') {
			var chapterTrack = document.createElement('track');
			chapterTrack.setAttribute('kind', 'chapters');
			chapterTrack.setAttribute('srclang', 'ja');
			chapterTrack.setAttribute('src', generateURL (resourceURL + EP + '/chapters.vtt', '', 5000));
			chapterTrack.setAttribute('default', true);
			videoNode.setAttribute('crossorigin', 'anonymous');
			videoNode.appendChild(chapterTrack);
			chapterTrack.onload = function () {displayChapters (videoNode);};
		}
	}
	
	return videoNode;
}

/*
function addVideoJSNode (fileName, format) {
	if (document.getElementById('media-holder').getElementsByTagName('video').length != 0) {
		document.getElementById('media-holder').getElementsByTagName('video')[0].remove();
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
		html5: {
			vhs: {
				overrideNative: true
			},
			nativeAudioTracks: false,
			nativeVideoTracks: false
		}
	};
	videoNode = videojs(videoNode, config);
	videoNode.src({
		src: url,
		type: 'application/x-mpegURL'
	});
	videoNode.ready(function() {
		this.hotkeys({
			volumeStep: 0.1,
			seekStep: 5,
			enableModifiersForNumbers: false
		});
	});
	//videojs.Vhs.GOAL_BUFFER_LENGTH = 30*60;
	//videojs.Vhs.MAX_GOAL_BUFFER_LENGTH = 2*60*60;
	//videojs.Vhs.GOAL_BUFFER_LENGTH_RATE = 1,

	return videoNode;
}
*/

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

function setHLS (player, url) {
	/*
	var config = {
		maxBufferLength: 120,
		maxMaxBufferLength: 900,
		maxBufferSize: 200*1000*1000
	};
	*/
	
	if (Hls.isSupported()) {
		url = generateURL (url, '', 5000);
		var hls = new Hls();
		hls.attachMedia(player);
		hls.on(Hls.Events.MEDIA_ATTACHED, function () {
			hls.loadSource(url);
		});
		
		hls.on(Hls.Events.ERROR, function (event, data) {
			if (data.fatal) {
				switch (data.type) {
					case Hls.ErrorTypes.NETWORK_ERROR:
						// try to recover network error
						console.log('fatal network error encountered, try to recover');
						hls.startLoad();
						break;
					case Hls.ErrorTypes.MEDIA_ERROR:
						console.log('fatal media error encountered, try to recover');
						hls.recoverMediaError();
						break;
					default:
						// cannot recover
						hls.destroy();
						break;
				}
			}
		});
	} else if (player.canPlayType('application/vnd.apple.mpegurl')) {
		url = generateURL (url, '?ios=true', 5000);
		player.src = url;
	}
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

function displayChapters (player) {
	var accordion = document.createElement('button');
	accordion.classList.add('accordion');
	accordion.innerHTML = 'CHAPTERS';
	
	var accordionPanel = document.createElement('div');
	accordionPanel.classList.add('panel');
	
	var cues = player.textTracks[0].cues;
	
	for (var i = 0; i < cues.length; i++) {
		let chapter = document.createElement('p');
		let timestamp = document.createElement('span');
		let cueText = document.createTextNode('\xa0\xa0' + cues[i].text);
		let startTime = cues[i].startTime
		timestamp.innerHTML = secToTimestamp (startTime);
		timestamp.onclick = function () {
			player.currentTime = startTime;
			player.play();
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
		var chapters = accordionPanel.getElementsByTagName('p');
		var currentTime = player.currentTime;
		if (cues.length != 0) {
			for (var i = 0; i < chapters.length; i++) {
				if (currentTime >= cues[i].startTime  && currentTime < cues[i].endTime) {
					chapters[i].className = 'current-chapter';
				} else {
					chapters[i].className = 'inactive-chapter';
				}
			}
		}
	};
	
	player.textTracks[0].oncuechange = updateChapterDisplay;
	
	player.addEventListener ('play', updateChapterDisplay);
	player.addEventListener ('pause', updateChapterDisplay);
	player.addEventListener ('seeking', updateChapterDisplay);
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
	var videoNode = document.getElementById('media-holder').getElementsByTagName('video')[0];
	
	function addCheckBuffer () {
		videoNode.pause();
		document.getElementById('loading-text').style.display = 'block';
		videoNode.removeEventListener ('play', buffering);
		videoNode.addEventListener ('play', checkBuffer);
		videoNode.addEventListener ('progress', checkBuffer);
	}
	
	if (videoNode.buffered.length == 0) {
		document.getElementById('loading-text').innerHTML = '動画を読み込んでいます。しばらくお待ちください。(0%)';
		addCheckBuffer ();
	} else {
		for (var i = 0; i < videoNode.buffered.length; i++) {
			if (videoNode.buffered.start(videoNode.buffered.length - 1 - i) - 0.25 <= videoNode.currentTime) {
				if (videoNode.buffered.end(videoNode.buffered.length - 1 - i) < Math.min(videoNode.currentTime+15, videoNode.duration)) {
					let loadingPercent = Math.round(Math.max(Math.min (videoNode.buffered.end(videoNode.buffered.length - 1 - i) - videoNode.currentTime, Math.min(15, videoNode.duration-videoNode.currentTime)), 0) / Math.min(15, videoNode.duration-videoNode.currentTime) * 1000) / 10;
					document.getElementById('loading-text').innerHTML = '動画を読み込んでいます。しばらくお待ちください。(' + loadingPercent + '%)';
					addCheckBuffer ();
				}
				break;
			}
		}
	}
}

function checkBuffer () {
	var videoNode = document.getElementById('media-holder').getElementsByTagName('video')[0];
	videoNode.pause();
	
	for (var i = 0; i < videoNode.buffered.length; i++) {
		if (videoNode.buffered.start(videoNode.buffered.length - 1 - i) - 0.25 <= videoNode.currentTime && videoNode.buffered.end(videoNode.buffered.length - 1 - i) >= videoNode.currentTime) {
			let loadingPercent = Math.round(Math.max(Math.min (videoNode.buffered.end(videoNode.buffered.length - 1 - i) - videoNode.currentTime, Math.min(15, videoNode.duration-videoNode.currentTime)), 0) / Math.min(15, videoNode.duration-videoNode.currentTime) * 1000) / 10;
			document.getElementById('loading-text').innerHTML = '動画を読み込んでいます。しばらくお待ちください。(' + loadingPercent + '%)';
			if (videoNode.buffered.end(videoNode.buffered.length - 1 - i) >= Math.min(videoNode.currentTime+15, videoNode.duration)) {
				document.getElementById('loading-text').style.display = 'none';
				videoNode.play();
				videoNode.removeEventListener ('play', checkBuffer);
				videoNode.removeEventListener ('progress', checkBuffer);
				videoNode.addEventListener ('play', buffering);
				break;	
			}
		}
	}
}