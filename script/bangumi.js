// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/bangumi') && !debug) {
		window.location.href = redirect ('https://featherine.com/bangumi');
		return 0;
	}
	
	document.getElementById('nav-btn').addEventListener('click', function () {
		navUpdate ();
	});
	
	document.getElementById('nav-menu-content-1').addEventListener('click', function () {
		goTo('top');
	});
	document.getElementById('nav-menu-content-2').addEventListener('click', function () {
		goTo('account');
	});
	document.getElementById('nav-menu-content-3').addEventListener('click', function () {
		goTo('info');
	});
	document.getElementById('nav-menu-content-4').addEventListener('click', function () {
		logout(function () {window.location.href = redirect (loginURL);});
	});
	
	start ('bangumi', function () {initialize();});

	function initialize () {

		var chapters = {name: [], startTime: []};
		var videoJSInstances = [];
		var seekTime = null;
		var ep;

		var seriesID = getURLParam ('series');
		if (seriesID == null) {
			window.location.href = topURL;
			return 0;
		} else {
			seriesID = parseInt(seriesID);
			if (isNaN(seriesID)) {
				window.location.href = topURL;
				return 0;   
			}
			if (seriesID < 0 || seriesID > 4294967295) {
				window.location.href = topURL;
				return 0; 
			}
		}

		var epIndex = getURLParam ('ep');
		if (epIndex == null) {
			var url = 'bangumi'+(debug?'.html':'')+'?series='+seriesID+'&ep=1';
			window.location.href = url;
			return 0;
		} else {
			epIndex = parseInt (epIndex);
			if (isNaN(epIndex)) {
				var url = 'bangumi'+(debug?'.html':'')+'?series='+seriesID+'&ep=1';
				window.location.href = url;
				return 0;
			} else if (epIndex<1) {
				var url = 'bangumi'+(debug?'.html':'')+'?series='+seriesID+'&ep=1';
				window.location.href = url;
				return 0; 
			}
			epIndex--;
		}
		
		var formatIndex = getURLParam ('format');
		if (formatIndex != null) {
			formatIndex = parseInt (formatIndex);
			if (isNaN(formatIndex)) {
				formatIndex = 1;
			} else if (formatIndex<1) {
				formatIndex = 1;
			}
			formatIndex--;
		} 

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (checkXHRResponse (this)) {
					try {
						ep = JSON.parse(this.responseText);
					} catch (e) {
						showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', topURL);
						return 0;
					}
					updatePage (ep);
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/request_ep.php", true);
		xmlhttp.withCredentials = true;
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.send("series="+seriesID+"&ep="+epIndex+((formatIndex==null)?'':('&format='+formatIndex)));


		function updatePage (ep) {
			document.getElementsByTagName("body")[0].classList.remove("hidden");

			var title =  ep.title;

			document.getElementById('title').innerHTML =  title;
			document.title = title + ' | featherine';

			updateEPSelector (ep.series);
			updateSeasonSelector (ep.seasons);

			if (ep.age_restricted) {
				document.getElementById('content').classList.add('hidden');
				document.getElementById('warning').classList.remove('hidden');
				document.getElementById('warning-button-yes').addEventListener('click', function () {
					document.getElementById('warning').classList.add('hidden');
					document.getElementById('content').classList.remove('hidden');
				});
				document.getElementById('warning-button-no').addEventListener('click', function () {
					window.location.href = topURL;
				});
			}
			
			/////////////////////////////////////////////device_authenticate/////////////////////////////////////////////
			setInterval (function () {
				let xmlhttp = new XMLHttpRequest();
				xmlhttp.onreadystatechange = function() {
					if (this.readyState == 4) {
						if (checkXHRResponse (this)) {
							if (this.responseText!='APPROVED') {
								showMessage ('エラーが発生しました', 'red', '不明なエラーが発生しました。 この問題が引き続き発生する場合は、管理者に連絡してください。', topURL, true);
								return false;
							}
						}
					}
				};
				xmlhttp.open("POST", serverURL + "/device_authenticate.php", true);
				xmlhttp.withCredentials = true;
				xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlhttp.send("token="+ep.token);
			}, 60*1000);

			/////////////////////////////////////////////Add Media/////////////////////////////////////////////
			var type = ep.type;

			if (type == 'video') {
				updateVideo (ep.file);
			} else if (type == 'audio') {
				updateAudio (ep.file);
			} else {
				updateImage (ep.file);
			}

			//smooth progress bar scrubbing https://github.com/videojs/video.js/issues/4460
			const SeekBar = videojs.getComponent('SeekBar');

			SeekBar.prototype.getPercent = function getPercent() {
				const time = this.player_.currentTime();
				const percent = time / this.player_.duration();
				return percent >= 1 ? 1 : percent;
			};

			SeekBar.prototype.handleMouseMove = function handleMouseMove(event) {
				let newTime = this.calculateDistance(event) * this.player_.duration();
				if (newTime === this.player_.duration()) {
					newTime = newTime - 0.1;
				}
				this.player_.currentTime(newTime);
				this.update();
			};
		}

		function updateEPSelector (series) {
			var epButtonWrapper = document.createElement('div');
			epButtonWrapper.id = 'ep-button-wrapper';
			for (var i = 0; i < series.length; i++) {
				let epButton = document.createElement('div');
				let epText = document.createElement('p');

				epText.innerHTML = series[i];

				if (epIndex == i) {
					epButton.classList.add('current-ep');
				}

				let targetEP = i+1;
				epButton.appendChild(epText);
				epButton.addEventListener('click', function () {goToEP(seriesID, targetEP);});

				epButtonWrapper.appendChild(epButton);
			}

			document.getElementById('ep-selector').appendChild(epButtonWrapper);

			if (document.getElementById('ep-button-wrapper').clientHeight/window.innerHeight > 0.50) {
				var showMoreButton = document.createElement('p');
				showMoreButton.id = 'show-more-button';
				showMoreButton.innerHTML = 'すべてを見る <span class="symbol">&#xE972;</span>';
				showMoreButton.addEventListener('click', toggleEpSelector);

				document.getElementById('ep-selector').appendChild(showMoreButton);
				document.getElementById('ep-button-wrapper').style.maxHeight = "50vh";
				document.getElementById('show-more-button').classList.add('clipped');
			}
		}

		function updateSeasonSelector (seasons) {
			var seasonButtonWrapper = document.createElement('div');
			seasonButtonWrapper.id = 'season-button-wrapper';

			if (seasons.length != 0) {
				for (var i = 0; i < seasons.length; i++) {
					let seasonButton = document.createElement('div');
					let seasonText = document.createElement('p');

					if (seasons[i].id != seriesID) {
						seasonText.innerHTML = seasons[i].season_name;
						seasonButton.appendChild (seasonText);
						let targetSeries = seasons[i].id;
						seasonButton.addEventListener('click', function () {goToEP(targetSeries, 1);});
					} else {
						seasonText.innerHTML = seasons[i].season_name;
						seasonButton.appendChild (seasonText);
						seasonButton.classList.add ('current-season');
					}
					seasonButtonWrapper.appendChild (seasonButton);
				}
				document.getElementById('season-selector').appendChild(seasonButtonWrapper);
			} else {
				document.getElementById('season-selector').classList.add('hidden');
			}
		}

		function updateVideo (file) {
			if (file.title!='') {
				let title = document.createElement('p');
				title.setAttribute('class', 'sub-title');
				title.classList.add('center-align');
				title.innerHTML = file.title;
				document.getElementById('media-holder').appendChild(title);
			}
			
			var formats = file.formats;

			var formatSelector = document.createElement('div');
			formatSelector.setAttribute('id', 'format-selector');

			var selectMenu = document.createElement('select');
			selectMenu.addEventListener("change", function () {
				formatSwitch (file);
			});
			
			if (formatIndex == null)
				formatIndex = 0;
			else if (formatIndex >= formats.length) {
				formatIndex = 0;
				updateURLParam ('format', 1);
			}

			for (var i = 0; i < formats.length; i++) {
				var format = formats[i];
				var option = document.createElement('option');

				option.setAttribute('value', format);
				option.innerHTML = format;

				if (i == formatIndex) {
					option.setAttribute('selected', true);
				}

				selectMenu.appendChild (option);
			}

			formatSelector.appendChild(selectMenu);
			document.getElementById('media-holder').appendChild(formatSelector);
			
			var timestampParam = getURLParam ('timestamp');
			if (timestampParam != null) {
				timestampParam = parseFloat (timestampParam);
				if (!isNaN(timestampParam)) {
					if (timestampParam<0) {
						timestampParam = 0;
					}
				}
			} else {
				timestampParam = 0;
			}

			//var videoNode = addVideoNode (fileName, formats[0].childNodes[0].nodeValue);
			addVideoJSNode (file.url, {chapters: file.chapters, currentTime: timestampParam});
			//videoJSInstances[0].load();
			
			setInterval (function () {
				if (videoJSInstances.length > 0) {
					updateURLParam ('timestamp', videoJSInstances[0].currentTime());
				}
			}, 3*1000);
		}

		function updateAudio (file) {
			document.getElementById('loader').classList.remove('hidden');
			document.getElementById('media-holder').classList.add('hidden');
			var counter = 0;

			if (file.info.album_title!='') {
				let albumTitle = document.createElement('p');
				albumTitle.setAttribute('class', 'sub-title');
				albumTitle.classList.add('center-align');
				albumTitle.innerHTML = file.info.album_title;
				document.getElementById('media-holder').appendChild(albumTitle);
				if (file.info.album_artist!='') {
					let albumArtist = document.createElement('p');
					albumArtist.setAttribute('class', 'artist');
					albumArtist.classList.add('center-align');
					albumArtist.innerHTML = file.info.album_artist;
					document.getElementById('media-holder').appendChild(albumArtist);
				}
			} else if (file.info.album_artist!='') {
				let titleElem = document.getElementById('title');
				let artistElem = document.createElement('span');
				artistElem.setAttribute('class', 'artist');
				artistElem.innerHTML = '<br/>' + file.info.album_artist;
				titleElem.appendChild(artistElem);
			}

			var config = {
				controls: true,
				autoplay: false,
				preload: 'auto',
				fluid: true,
				aspectRatio: "1:0",
				crossOrigin: "use-credentials",
				controlBar: {
					fullscreenToggle: false,
					pictureInPictureToggle: false
				},
				html5: {
					vhs: {
						withCredentials: true,
						overrideNative: !videojs.browser.IS_SAFARI
					},
					nativeAudioTracks: false,
					nativeVideoTracks: false
				}
			};

			for (var i = 0; i < file.list.length; i++) {
				let index = i;

				let audioNode = document.createElement('audio');
				let subtitle = document.createElement('p');

				audioNode.id = 'track'+index;

				document.getElementById('media-holder').appendChild(subtitle);
				document.getElementById('media-holder').appendChild(audioNode);

				audioNode.classList.add("vjs-default-skin");
				audioNode.classList.add("video-js");
				audioNode.setAttribute('lang', 'en');
				let audio = videojs(audioNode, config, function () {
					videoJSInstances.push(audio);

					audio.src({
						src: file.list[index].url,
						type: 'application/x-mpegURL'
					});

					audio.volume(1);
					audio.muted(true);
					
					let playPromise = audio.play();
					if (playPromise !== undefined) {
						playPromise.then(_ => {
							let initialUnmute = function () {
								audio.off('pause', initialUnmute);
								audio.currentTime(0);
								audio.muted(false);
								counter ++;
								if (counter == file.list.length) {
									audioReady ();
								}
							};
							audio.on('pause', initialUnmute);
							audio.pause();
						}).catch(error => {
							audio.currentTime(0);
							audio.muted(false);

							counter ++;
							if (counter == file.list.length) {
								audioReady ();
							}
						});
					}
				});
				document.getElementById('track' + i).addEventListener('contextmenu', event => event.preventDefault());

				if (file.list[i].title != '') {
					subtitle.setAttribute('class', 'sub-title');
					subtitle.innerHTML = file.list[i].title;

					if (file.list[i].artist != '') {
						let artist = document.createElement('span');
						artist.setAttribute('class', 'artist');
						artist.innerHTML = '／' + file.list[i].artist;
						subtitle.appendChild(artist);
					}
				} 
			}

			function audioReady () {
				for (var i = 0; i < videoJSInstances.length; i++) {
					let index = i;
					videoJSInstances[index].on('play', function () {
						for (var j = 0; j < videoJSInstances.length; j++) {
							if (j != index) {
								videoJSInstances[j].pause();
							}
						}
					});
					videoJSInstances[index].on('ended', function () {
						if (index != videoJSInstances.length-1) {
							videoJSInstances[index+1].play();
						}
					});
				}
				document.getElementById('loader').classList.add('hidden');
				document.getElementById('media-holder').classList.remove('hidden');
			}
		}

		function updateImage (file) {

			for (var i = 0; i < file.length; i++) {
				let index = i;
				
				if (file[i].tag != '') {
					let subtitle = document.createElement('p');
					subtitle.setAttribute('class', 'sub-title');
					subtitle.innerHTML = file[i].tag;
					document.getElementById('media-holder').appendChild(subtitle);
				}

				let imageNode = document.createElement('div');
				let overlay = document.createElement('div');
				let url = file[i].url;
				
				overlay.classList.add('overlay');
				imageNode.appendChild(overlay);

				imageNode.classList.add('lazyload');
				imageNode.dataset.crossorigin = 'use-credentials';
				imageNode.dataset.src = url;
				imageNode.dataset.alt = document.getElementById('title').innerHTML;
				imageNode.addEventListener('click', function() {
					let param = {
						url: url,
						title: document.getElementById('title').innerHTML,
						token: ep.token
					};
					window.localStorage.setItem('image-param', JSON.stringify(param));
					if (debug) {
						window.location.href = 'image.html';
					} else {
						window.open ('image');
					}
				});
				imageNode.addEventListener('contextmenu', event => event.preventDefault());
				document.getElementById('media-holder').appendChild(imageNode);
			}

			lazyloadInitialize ();
		}

		function formatSwitch (file) {
			var selectedFormat = document.getElementById('format-selector').getElementsByTagName('select')[0].selectedIndex;

			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (checkXHRResponse (this)) {
						var currentTime = videoJSInstances[0].currentTime();
						var paused = videoJSInstances[0].paused();
						
						updateURLParam ('format', selectedFormat+1);
						addVideoJSNode (this.responseText, {chapters: file.chapters, currentTime: currentTime, play: !paused});
					}
				}
			};
			xmlhttp.open("POST", serverURL + "/format_switch.php", true);
			xmlhttp.withCredentials = true;
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send("file="+encodeURIComponent(JSON.stringify(file))+"&format="+selectedFormat);

			/*
			var resume = function () {
				videoJSInstances[0].currentTime(currentTime);
				if (!paused)
					videoJSInstances[0].play();
				videoJSInstances[0].off ('loadedmetadata', resume);
			};

			videoJSInstances[0].load();
			videoJSInstances[0].on('loadedmetadata', resume);*/
		}

		function addVideoJSNode (url, options) {
			if (videoJSInstances.length != 0) {
				videoJSInstances=[];
				if (document.getElementById('media-holder').getElementsByClassName('chapters').length != 0) {
					document.getElementById('media-holder').getElementsByClassName('chapters')[0].remove();
				}
				videojs(document.getElementById('media-holder').getElementsByTagName('video-js')[0]).dispose();
			}

			var videoNode = document.createElement('video-js');
			videoNode.classList.add('vjs-big-play-centered');
			videoNode.setAttribute('lang', 'en');

			videoNode.addEventListener('contextmenu', event => event.preventDefault());
			document.getElementById('media-holder').appendChild(videoNode);

			var config = {
				controls: true,
				autoplay: false,
				preload: 'auto',
				fluid: true,
				playsinline: true,
				crossOrigin: "use-credentials",
				html5: {
					vhs: {
						withCredentials: true,
						overrideNative: !videojs.browser.IS_SAFARI
					},
					nativeAudioTracks: false,
					nativeVideoTracks: false
				},
				userActions: {
					hotkeys: function(event) {
						if (event.which === 32 || event.which === 75) {
							if (this.paused())
								this.play();
							else
								this.pause();
						}
						else if (event.which === 39)
							this.currentTime(this.currentTime()+5);
						else if (event.which === 37)
							this.currentTime(this.currentTime()-5);
						else if (event.which === 70) {
							if (document.fullscreen)
								this.exitFullscreen();
							else
								this.requestFullscreen();
						}
						else if (event.which === 77)
							this.muted(!this.muted());
						event.preventDefault();
					}
				}
			};
			var video = videojs(videoNode, config, function () {
				videoJSInstances=[video];

				if (!videojs.browser.IS_SAFARI) {//Hls.isSupported()
					video.on ('play', buffering);
					video.on ('seeked', function () {
						seekTime = video.currentTime();
						var paused = video.paused();
						video.pause();
						if (!paused)
							video.play();
					});

					var initialPause = function () {
						video.off ('loadeddata', initialPause);
						var paused = video.paused();
						video.pause();
						if (!paused)
							video.play();
					};
					video.on ('loadeddata', initialPause);

					video.src({
						src: url,
						type: 'application/x-mpegURL'
					});
				} else {
					video.src({
						src: url,
						type: 'application/x-mpegURL'
					});
				}

				video.volume(1);

				if (options.play==true) {
					video.play();
				} else {
					video.load();
					if (!video.paused()){
						video.pause();
					}
				}
				if (options.currentTime!=undefined) {
					video.currentTime(options.currentTime);
				}

				videoNode.getElementsByClassName('vjs-fullscreen-control')[0].addEventListener('click', function () {
					videoNode.focus();
				});

				if (options.chapters != '') {
					displayChapters (options.chapters);
				}
				
				video.on ('pause', function () {
					updateURLParam ('timestamp', video.currentTime());
				});
			});

			/*
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
					enableModifiersForNumbers: false,
					//captureDocumentHotkeys: true,
					//documentHotkeysFocusElementFilter: () => true
				});
			});*/

			//videojs.Vhs.GOAL_BUFFER_LENGTH = 30*60;
			//videojs.Vhs.MAX_GOAL_BUFFER_LENGTH = 2*60*60;
			//videojs.Vhs.GOAL_BUFFER_LENGTH_RATE = 1,
		}

		function goToEP (dest_series, dest_ep) {
			var url = 'bangumi'+(debug?'.html':'')+'?series='+dest_series+'&ep='+dest_ep;
			window.location.href = url;
		}

		function toggleEpSelector () {
			let clipped = document.getElementById('show-more-button').classList.contains('clipped');
			document.getElementById('show-more-button').innerHTML = clipped ? '非表示にする <span class="symbol">&#xE971;</span>' : 'すべてを見る <span class="symbol">&#xE972;</span>';
			if (clipped) {
				document.getElementById('ep-button-wrapper').style.maxHeight = document.getElementById('ep-button-wrapper').scrollHeight + "px";
			} else {
				document.getElementById('ep-button-wrapper').style.maxHeight = "50vh";
			}
			document.getElementById('show-more-button').classList.toggle('clipped');
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

		function displayChapters (chaptersXML) {
			//parse chapters
			var parser = new DOMParser();
			chaptersXML = parser.parseFromString(chaptersXML,"text/xml");
			let ChapterString = chaptersXML.querySelectorAll('ChapterString');
			let ChapterTimeStart = chaptersXML.querySelectorAll('ChapterTimeStart');

			chapters = {name: [], startTime: []};
			for (var i = 0; i < ChapterString.length; i++) {
				chapters.name.push(ChapterString[i].childNodes[0].nodeValue);
				let timestamp = ChapterTimeStart[i].childNodes[0].nodeValue.split(":");
				let startTime = parseInt (timestamp[0]) * 60 * 60 + parseInt (timestamp[1]) * 60 + parseFloat (timestamp[2]);
				//startTime = Math.round(startTime*1000)/1000;
				chapters.startTime.push(startTime);
			}

			//display chapters
			var chapterLength = chapters.name.length;
			var accordion = document.createElement('button');
			accordion.classList.add('accordion');
			accordion.innerHTML = 'CHAPTERS';

			var accordionPanel = document.createElement('div');
			accordionPanel.classList.add('panel');

			for (i = 0; i < chapterLength; i++) {
				let chapter = document.createElement('p');
				let timestamp = document.createElement('span');
				let cueText = document.createTextNode('\xa0\xa0' + chapters.name[i]);
				let startTime = chapters.startTime[i];
				timestamp.innerHTML = secToTimestamp (startTime);
				timestamp.addEventListener ('click', function () {
					videoJSInstances[0].currentTime(startTime);
					videoJSInstances[0].play();
				});
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
				var currentTime = videoJSInstances[0].currentTime();
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

			videoJSInstances[0].on ('timeupdate', updateChapterDisplay);
			videoJSInstances[0].on ('play', updateChapterDisplay);
			videoJSInstances[0].on ('pause', updateChapterDisplay);
			videoJSInstances[0].on ('seeking', updateChapterDisplay);
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
			seekTime = videoJSInstances[0].currentTime();
			function addCheckBuffer () {
				videoJSInstances[0].muted(true);
				document.getElementById('media-holder').getElementsByClassName('video-js')[0].classList.add('vjs-seeking');
				videoJSInstances[0].off ('play', buffering);
				videoJSInstances[0].on ('play', checkBuffer);
				videoJSInstances[0].on ('progress', checkBuffer);
				videoJSInstances[0].on ('timeupdate', checkBuffer);
			}

			if (videoJSInstances[0].buffered().length == 0) {
				addCheckBuffer ();
			} else {
				for (var i = 0; i < videoJSInstances[0].buffered().length; i++) {
					if (videoJSInstances[0].buffered().start(videoJSInstances[0].buffered().length - 1 - i) - 0.1 <= videoJSInstances[0].currentTime()) {
						if (videoJSInstances[0].buffered().end(videoJSInstances[0].buffered().length - 1 - i) < Math.min(videoJSInstances[0].currentTime()+15, videoJSInstances[0].duration())) {
							addCheckBuffer ();
						}
						break;
					}
				}
			}
		}

		function checkBuffer () {
			if (!videoJSInstances[0].paused() && videoJSInstances[0].readyState() > 2) {
				videoJSInstances[0].pause();
			}
			document.getElementById('media-holder').getElementsByClassName('video-js')[0].classList.add('vjs-seeking');

			for (var i = 0; i < videoJSInstances[0].buffered().length; i++) {
				if (videoJSInstances[0].buffered().start(videoJSInstances[0].buffered().length - 1 - i) - 0.1 <= videoJSInstances[0].currentTime() && videoJSInstances[0].buffered().end(videoJSInstances[0].buffered().length - 1 - i) >= videoJSInstances[0].currentTime()) {
					if (videoJSInstances[0].buffered().end(videoJSInstances[0].buffered().length - 1 - i) >= Math.min(videoJSInstances[0].currentTime()+15, videoJSInstances[0].duration())) {
						document.getElementById('media-holder').getElementsByClassName('video-js')[0].classList.remove('vjs-seeking');
						videoJSInstances[0].off ('play', checkBuffer);
						videoJSInstances[0].off ('progress', checkBuffer);
						videoJSInstances[0].off ('timeupdate', checkBuffer);
						videoJSInstances[0].currentTime (seekTime);
						videoJSInstances[0].muted(false);
						let playPromise = videoJSInstances[0].play();
						if (playPromise !== undefined) {
							playPromise.then(_ => {
								videoJSInstances[0].on ('play', buffering);
							});
						}
						break;	
					}
				}
			}
		}
		
		
		function updateURLParam (key, value) {
			var url = 'bangumi'+(debug?'.html':'')+'?series='+seriesID+'&ep='+(epIndex+1);
			var currentFormat = getURLParam ('format');
			var currentTimestamp = getURLParam ('timestamp');
			if (key == 'format') {
				url += '&format='+value+((currentTimestamp==null)?'':('&timestamp='+currentTimestamp));
			} else if (key == 'timestamp') {
				url += ((currentFormat==null)?'':('&format='+currentFormat))+'&timestamp='+value;
			}
			
			history.replaceState(null, '', url);
		}
	}
});