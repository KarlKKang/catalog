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
		var mediaInstances = [], hlsInstances = [];
		var token;

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
	
		//var USE_NATIVE = TOUCH_ENABLED || IS_IPHONE || IS_NATIVE_ANDROID || IS_SAFARI;
		var USE_MSE = Hls.isSupported() && !IS_SAFARI;
		//var USE_NATIVE = true;


		function updatePage (ep) {
			document.getElementsByTagName("body")[0].classList.remove("hidden");
			
			token = ep.token;

			var title =  ep.title;

			document.getElementById('title').innerHTML =  title;
			document.title = title + ' | featherine';

			updateEPSelector (ep.series);
			updateSeasonSelector (ep.seasons);

			if (ep.age_restricted) {
				if (ep.age_restricted.toLowerCase() == 'r15+') {
					document.getElementById('warning-title').innerHTML = '「R15+指定」<br>年齢認証';
				} else if (ep.age_restricted.toLowerCase() == 'r18+') {
					document.getElementById('warning-title').innerHTML = '「R18+指定」<br>年齢認証';
				}
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
			////////////////////////////////////////////////////////////////////////////////
			
			
			function updateURLTimestamp() {
				function update () {
					var video = mediaInstances[0].media;
					if (video) {
						updateURLParam ('timestamp', video.currentTime);
					}
				}
				var video = mediaInstances[0].media;
				video.addEventListener ('pause', function () {
					update ();
				});
				setInterval (function () {
					update ();
				}, 3*1000);
			}
			
			var videoJS = document.createElement('video-js');
				
			videoJS.classList.add('vjs-big-play-centered');
			videoJS.setAttribute('lang', 'en');
			document.getElementById('media-holder').appendChild(videoJS);

			var config = {
				controls: true,
				autoplay: false,
				preload: 'auto',
				fluid: true,
				playsinline: true,
			};

			videojs(videoJS, config, function () {
				videoJS.style.paddingTop = 9/16*100 + '%';
				videoJS = videoJS.cloneNode(true);
				this.dispose();
				mediaInstances.push(videojs_mod (videoJS, {useNative: !USE_MSE}));
				document.getElementById('media-holder').appendChild(videoJS);

				addVideoNode (file.url, {chapters: file.chapters, currentTime: timestampParam});
				updateURLTimestamp();
			});
		}
		
		function updateAudio (file) {
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
			//
			
			var config = {
				controls: true,
				autoplay: false,
				preload: 'auto',
				fluid: true,
				aspectRatio: "1:0",
				controlBar: {
					fullscreenToggle: false,
					pictureInPictureToggle: false
				}
			};
			
			var i;

			for (i = 0; i < file.list.length; i++) {
				let index = i;

				let audioNode = document.createElement('audio');
				let subtitle = document.createElement('p');
				subtitle.setAttribute('class', 'sub-title');
				let format = document.createElement('span');
				
				audioNode.id = 'track'+index;
				
				audioNode.classList.add("vjs-default-skin");
				audioNode.classList.add("video-js");
				audioNode.setAttribute('lang', 'en');
				
				//subtitle
				if (file.list[i].title != '') {
					subtitle.innerHTML = file.list[i].title;

					if (file.list[i].artist != '') {
						let artist = document.createElement('span');
						artist.setAttribute('class', 'artist');
						artist.innerHTML = '／' + file.list[i].artist;
						subtitle.appendChild(artist);
					}
				}
				
				//format
				if (file.list[i].format != '') {
					if (subtitle.innerHTML != '')
						subtitle.innerHTML += '<br />';
					
					format.setAttribute('class', 'format');
					format.innerHTML = file.list[i].format;
					
					let samplerate = file.list[i].samplerate;
					if (samplerate != '') {
						let samplerateText = samplerate;
						switch (samplerate) {
							case '44100':
								samplerateText = '44.1kHz';
								break;
							case '48000':
								samplerateText = '48.0kHz';
								break;
							case '96000':
								samplerateText = '96.0kHz';
								break;
							case '88200':
								samplerateText = '88.2kHz';
								break;
							case '192000':
								samplerateText = '192.0kHz';
								break;
						}
						format.innerHTML += ' ' + samplerateText;
						
						let bitdepth = file.list[i].bitdepth;
						if (bitdepth != '') {
							let bitdepthText = bitdepth;
							switch (bitdepth) {
								case '16':
									bitdepthText = '16bit';
									break;
								case '24':
									bitdepthText = '24bit';
									break;
								case '32':
									bitdepthText = '32bit';
									break;	
							}
							format.innerHTML += '/' + bitdepthText;
						}
					}
					subtitle.appendChild(format);
				}
				
				document.getElementById('media-holder').appendChild(subtitle);
				document.getElementById('media-holder').appendChild(audioNode);

				videojs(audioNode, config, function () {
					let oldAudioNode = document.getElementById('track' + index);
					audioNode = oldAudioNode.cloneNode(true);
					mediaInstances[index] = videojs_mod (audioNode, {audio: true});
					
					oldAudioNode.parentNode.insertBefore(audioNode, oldAudioNode.nextSibling);
					this.dispose();
					
					let audio = mediaInstances[index].media;
					audio.volume = 1;
					
					let url = file.list[index].url;
					
					if (file.list[index].flac_fallback_url != '' && !audio.canPlayType('video/mp4; codecs="alac"')) {
						url = file.list[index].flac_fallback_url;
						format.innerHTML = format.innerHTML.replace('ALAC', 'FLAC');
						format.innerHTML = format.innerHTML.replace('32bit', '24bit');
					}

					if (USE_MSE) {
						var config = {
							enableWebVTT: false,
							enableIMSC1: false,
							enableCEA708Captions: false,
							lowLatencyMode: false,
							enableWorker: false,
							maxFragLookUpTolerance: 0,
							appendErrorMaxRetry: 0,
							debug: false,
							xhrSetup: function(xhr, url) {
								xhr.withCredentials = true;
							}
						}

						let hls = new Hls(config);
						hlsInstances[index]=hls;
						hls.on(Hls.Events.ERROR, function (event, data) {
							if (data.fatal) {
								hls.destroy();
								if (data.type == Hls.ErrorTypes.MEDIA_ERROR) {
									updateAudioVJS(index, url);
									if (debug)
										console.log('hls.js failed to handle the audio source for index: ' + index + ', switching to video.js');
								}
								else
									showPlaybackError('Index ' + index + ': ' + data.detail);
							}
						});
						hls.on(Hls.Events.MANIFEST_PARSED, function () {
							counter ++;
							if (counter == file.list.length) {
								audioReady ();
							}
						});
						hls.loadSource(url);
						hls.attachMedia(audio);
					} else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
						audio.addEventListener('error', function () {showPlaybackError();});
						audio.setAttribute ('crossorigin', 'use-credentials');
						audio.addEventListener('loadedmetadata', function () {
							counter ++;
							if (counter == file.list.length) {
								audioReady ();
							}
						});
						audio.src = url;
						audio.load();
					} else {
						showCompatibilityError ();
					}
				});
			
			}
			
			function audioReady () {
				for (var i = 0; i < mediaInstances.length; i++) {
					let index = i;
					mediaInstances[index].media.addEventListener('play', function () {
						for (var j = 0; j < mediaInstances.length; j++) {
							if (j != index) {
								mediaInstances[j].pause();
							}
						}
					});
					mediaInstances[index].media.addEventListener('ended', function () {
						if (index != mediaInstances.length-1) {
							mediaInstances[index+1].play();
						}
					});
				}
			}
		}
		
		function updateAudioVJS (index, url) {
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
						withCredentials: true
					}
				}
			};
			
			if (!USE_MSE) {
				config.html5.vhs.overrideNative = false;
			} else {
				config.html5.vhs.overrideNative = true;
				config.html5.nativeAudioTracks = false;
				config.html5.nativeVideoTracks = false;
			}
			
			let audioNode = document.createElement('audio');
			document.getElementById('track'+index).replaceWith(audioNode);
			audioNode.id = 'track'+index;

			audioNode.classList.add("vjs-default-skin");
			audioNode.classList.add("video-js");
			audioNode.setAttribute('lang', 'en');
			let audio = videojs(audioNode, config, function () {
				mediaInstances[index] = audio;
				
				audio.on('error', function() {
					showPlaybackError('Index ' + index + ': ' + 'videojs: '+JSON.stringify(audio.error()));
				});

				audio.src({
					src: url,
					type: 'application/x-mpegURL'
				});

				audio.volume(1);
					
				audioReady ();
			});
			document.getElementById('track'+index).addEventListener('contextmenu', event => event.preventDefault());
			
			function audioReady () {
				mediaInstances[index].on('play', function () {
					for (var j = 0; j < mediaInstances.length; j++) {
						if (j != index) {
							mediaInstances[j].pause();
						}
					}
				});
				mediaInstances[index].on('ended', function () {
					if (index != mediaInstances.length-1) {
						mediaInstances[index+1].play();
					}
				});
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
						token: token
					};
					document.cookie = 'image-param='+encodeURIComponent(JSON.stringify(param))+';max-age=30;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
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
			var video = mediaInstances[0].media;

			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (checkXHRResponse (this)) {
						var currentTime = video.currentTime;
						var paused = video.paused;
						
						updateURLParam ('format', selectedFormat+1);
						addVideoNode (this.responseText, {chapters: file.chapters, currentTime: currentTime, play: !paused});
					}
				}
			};
			xmlhttp.open("POST", serverURL + "/format_switch.php", true);
			xmlhttp.withCredentials = true;
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xmlhttp.send("token="+token+"&format="+selectedFormat);

			/*
			var resume = function () {
				mediaInstances[0].currentTime(currentTime);
				if (!paused)
					mediaInstances[0].play();
				mediaInstances[0].off ('loadedmetadata', resume);
			};

			mediaInstances[0].load();
			mediaInstances[0].on('loadedmetadata', resume);*/
		}

		function addVideoNode (url, options) {
			if (hlsInstances.length != 0) {
				hlsInstances[0].destroy();
				hlsInstances=[];
			}

			var video = mediaInstances[0].media;
			
			function videoReady () {
				video.volume = 1;
					
				if (options.currentTime!=undefined) {
					video.currentTime = options.currentTime;
				}
					
				if (options.chapters != '' && document.getElementById('media-holder').getElementsByClassName('chapters').length == 0) {
					displayChapters (options.chapters);
				}

				if (options.play) {
					mediaInstances[0].play();
				} else {
					mediaInstances[0].pause();
				}
			}
			
			if (USE_MSE) {
				var config = {
					enableWebVTT: false,
					enableIMSC1: false,
					enableCEA708Captions: false,
					lowLatencyMode: false,
					enableWorker: false,
					maxFragLookUpTolerance: 0.0,
					testBandwidth: false,
					debug: false,
					xhrSetup: function(xhr, url) {
						xhr.withCredentials = true;
					}
				}
				
				let hls = new Hls(config);
				
				hls.on(Hls.Events.ERROR, function (event, data) {
					if (data.fatal) {
						showPlaybackError(data.detail);
					}
				});
				hls.on(Hls.Events.MANIFEST_PARSED, function () {
					hlsInstances=[hls];
					videoReady ();
					
				});
				
				video.addEventListener('seeking', function () {
					if (!mediaInstances[0].seekingForward) {
						hls.once(Hls.Events.BUFFER_FLUSHED, function () {
							hls.startLoad(video.currentTime);
							if (debug) {
								console.log('Buffer reloaded.');
							}
						});
						hls.trigger(Hls.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: video.duration});
						if (debug) {
							console.log('Buffer flushed.');
						}
					} else {
						mediaInstances[0].seekingForward = false;
					}
				});
				hls.on(Hls.Events.FRAG_CHANGED, (e, data) => { 
					const range = { startOffset: 0, endOffset: data.frag.startDTS }; 
					hls.trigger(Hls.Events.BUFFER_FLUSHING, range); 
					if (debug) {
						console.log('Back buffer flushed.');
					}
				});
				hls.loadSource(url);
				hls.attachMedia(video);
			} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
				video.addEventListener('error', function () {showPlaybackError ();});
				video.setAttribute ('crossorigin', 'use-credentials');
				video.addEventListener('loadedmetadata', function () {
					videoReady ();
					/*
					if (options.play) {
						video.play();
					} else {
						video.pause();
					}*/
				});
				video.src = url;
				video.load();
			} else {
				showCompatibilityError ();
			}
		}
		
		function showPlaybackError (detail) {
			document.getElementById('media-holder').classList.add('hidden');
			document.getElementById('message-body').innerHTML = '<p>再生中にエラーが発生しました。後ほどもう一度お試しいただくか、それでも問題が解決しない場合は管理者にお問い合わせください。</p>'+(detail?('<p>Error detail: '+detail+'</p>'):'');
			document.getElementById('message').classList.remove('hidden');
		}
		
		function showCompatibilityError () {
			document.getElementById('media-holder').classList.add('hidden');
			document.getElementById('message-body').innerHTML = '<p>お使いのブラウザやデバイスはHLSに対応していません。HLSに対応している一般的なブラウザを以下に示します。</p>\
			<ul>\
				<li><p>Chrome 39+ for Android</p></li>\
				<li><p>Chrome 39+ for Desktop</p></li>\
				<li><p>Firefox 41+ for Android</p></li>\
				<li><p>Firefox 42+ for Desktop</p></li>\
				<li><p>Edge for Windows 10+</p></li>\
				<li><p>Safari 6.0+ for macOS, iOS and iPadOS</p></li>\
			</ul>';
			document.getElementById('message').classList.remove('hidden');
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
			
			var video = mediaInstances[0].media;

			for (i = 0; i < chapterLength; i++) {
				let chapter = document.createElement('p');
				let timestamp = document.createElement('span');
				let cueText = document.createTextNode('\xa0\xa0' + chapters.name[i]);
				let startTime = chapters.startTime[i];
				timestamp.innerHTML = secToTimestamp (startTime);
				timestamp.addEventListener ('click', function () {
					if (video.currentTime <= startTime) {
						mediaInstances[0].seekingForward = true;
					}
					video.currentTime = startTime;
					mediaInstances[0].controls.focus();
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
				var currentTime = video.currentTime;
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
			
			video.addEventListener ('timeupdate', updateChapterDisplay);
			video.addEventListener ('play', updateChapterDisplay);
			video.addEventListener ('pause', updateChapterDisplay);
			video.addEventListener ('seeking', updateChapterDisplay);
			video.addEventListener ('seeked', updateChapterDisplay);
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