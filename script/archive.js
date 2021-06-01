// JavaScript Document

function updateAudio () {
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
	
	for (var i = 0; i < files.length; i++) {
		let audioNode = document.createElement('audio');
		let subtitle = document.createElement('p');
		
		let url = resourceURL + EP + '/' + encodeURI('_MASTER_' + files[i].childNodes[0].nodeValue + '.m3u8');
		
		setHLS (audioNode, url);
		
		audioNode.setAttribute('controls', true);
		audioNode.setAttribute('controlsList', 'nodownload');
		subtitle.setAttribute('class', 'sub-title');
		subtitle.innerHTML = files[i].getAttribute('tag');
		audioNode.addEventListener('contextmenu', event => event.preventDefault());
		
		if (files[i].getAttribute('artist')!=null) {
			let artist = document.createElement('span');
			artist.setAttribute('class', 'artist');
			artist.innerHTML = '／' + files[i].getAttribute('artist');
			subtitle.appendChild(artist);
		}
		document.getElementById('media-holder').appendChild(subtitle);
		document.getElementById('media-holder').appendChild(audioNode);
	}
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