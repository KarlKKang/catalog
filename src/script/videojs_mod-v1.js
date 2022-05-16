// JavaScript Document

function videojs_mod (videoJS, callback) {
	
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
		reattach (videoJS);
		document.getElementById('media-holder').appendChild(videoJS);
		
		callback();
	});
	
	function reattach (controls) {
		let video = controls.getElementsByTagName('video')[0];
		video.id = 'video-node';
		controls.addEventListener('contextmenu', event => event.preventDefault());
		
		//State variables
		let playing = false;
		let buffering = false;
		let dragging = false;
		
		//Elements
		let controlBar = controls.getElementsByClassName('vjs-control-bar')[0];
		let playButton = controlBar.getElementsByClassName('vjs-play-control')[0];
		let durationDisplay = controlBar.getElementsByClassName('vjs-duration')[0].getElementsByClassName('vjs-duration-display')[0];
		let currentTimeDisplay = controlBar.getElementsByClassName('vjs-current-time')[0].getElementsByClassName('vjs-current-time-display')[0];
		let progressControl = controlBar.getElementsByClassName('vjs-progress-control')[0];
		let progressHolder = progressControl.getElementsByClassName('vjs-progress-holder')[0];
		let progressBar = progressHolder.getElementsByClassName('vjs-play-progress')[0];
		let progressMouseDisplay = progressHolder.getElementsByClassName('vjs-mouse-display')[0];
		let progressTooltip;
		if (progressMouseDisplay) {
			progressTooltip = progressMouseDisplay.getElementsByClassName('vjs-time-tooltip')[0];
		}
		let loadProgress = progressHolder.getElementsByClassName('vjs-load-progress')[0];
		let fullscreenButton = controlBar.getElementsByClassName('vjs-fullscreen-control')[0];
		let PIPButton = controlBar.getElementsByClassName('vjs-picture-in-picture-control')[0];
		
		//Fluid resize and duration
		video.addEventListener('loadedmetadata', function () {
			video.pause();
			startBuffer ();
			let width = this.videoWidth, height = this.videoHeight;
			controls.style.paddingTop = height/width*100 + '%';
			durationDisplay.innerHTML = secToTimestamp (this.duration);
		});
		
		//Load progress
		video.addEventListener('progress', function () {
			let bufferEnd = 0;
			for (var i = this.buffered.length - 1; i >= 0; i--) {
				if (this.buffered.start(i) <= this.currentTime) {
					bufferEnd = this.buffered.end(i);
					break;
				}
			}
			loadProgress.style.width = bufferEnd / video.duration * 100 + '%';
		});
		
		//Loading
		video.addEventListener('waiting', function() {
			controls.classList.add('vjs-seeking');
			this.pause();
		});
		
		video.addEventListener('canplaythrough', function() {
			if (!buffering)
				controls.classList.remove('vjs-seeking');
			if (playing)
				play();
		});
		
		//Big play button
		let bigPlayButton = controls.getElementsByClassName('vjs-big-play-button')[0];
		bigPlayButton.addEventListener('click', function (event) {
			event.stopPropagation();
			controls.classList.add('vjs-has-started');
			play ();
			controls.focus();
		}, true);
		
		//Play button
		playButton.addEventListener('click', function (event) {
			event.stopPropagation();
			if (this.classList.contains('vjs-ended')) {
				controls.classList.remove('vjs-ended');
				playButton.classList.remove('vjs-ended');
				video.currentTime = 0;
				play ();
			} else {
				togglePlayback ();
			}
			controls.focus();
		}, true);
		
		//Progress bar 
		let countdown = 3000;
		setInterval (function () {
			currentTimeDisplay.innerHTML = secToTimestamp (video.currentTime);
			if (!dragging && video.duration)
				progressBar.style.width = video.currentTime/video.duration*100 + '%';
			if (countdown != 0) {
				countdown -= 300;
				if (countdown == 0) {
					controls.classList.remove('vjs-user-active');
					controls.classList.add('vjs-user-inactive');
				}
			}
		}, 300);
		addMultipleEventListeners (controls, ['mousemove', 'click', 'touchend'], function () {
			controls.classList.remove('vjs-user-inactive');
			controls.classList.add('vjs-user-active');
			countdown = 3000;
		}, false);
		
		//Progress bar drag
		addMultipleEventListeners (progressControl, ['mousedown', 'touchstart'], function () {
			dragging = true;
			if (controls.classList.contains('vjs-ended')) {
				controls.classList.remove('vjs-ended');
				playButton.classList.remove('vjs-ended');
			}
		});
		
		addMultipleEventListeners (document, ['mouseup', 'touchend'], function () {
			if (dragging) {
				dragging = false;
			
				let mouseX;
				if (event.type == 'touchend') {
					let touch = event.touches[0] || event.changedTouches[0];
					mouseX = touch.pageX;
				} else {
					mouseX = event.pageX;
				}
				let position = progressHolder.getBoundingClientRect();
				let totalLength = position.right-position.left;
				let leftPadding = Math.min(Math.max(mouseX-position.left, 0), totalLength);
				let percentage = leftPadding/totalLength;
				let currentTime = video.duration*percentage;
				
				if (currentTime == video.duration) {
					controls.classList.add('vjs-ended');
					playButton.classList.add('vjs-ended');
				}

				video.currentTime = currentTime;
				controls.focus();
			}
		});
		
		
		//Progress bar mouse display
		addMultipleEventListeners (progressControl, ['mousemove', 'touchmove'], function () {
			if (event.type == 'touchmove')
				event.preventDefault();
			let mouseX;
			if (event.type == 'touchmove') {
				let touch = event.touches[0] || event.changedTouches[0];
				mouseX = touch.pageX;
			} else {
				mouseX = event.pageX;
			}
			let position = progressHolder.getBoundingClientRect();
			let totalLength = position.right-position.left;
			let leftPadding = Math.min(Math.max(mouseX-position.left, 0), totalLength);
			let percentage = leftPadding/totalLength;
			let currentTime = video.duration*percentage;
			if (progressMouseDisplay) {
				progressMouseDisplay.style.left = leftPadding + 'px';
				progressTooltip.innerHTML = secToTimestamp(currentTime);
				progressTooltip.style.right = -progressTooltip.offsetWidth/2 + 'px';
			}
			if (dragging) {
				video.currentTime = currentTime;
				progressBar.style.width = percentage*100 + '%';
			}	
		});
		
		//Fullscreen
		function requestFullscreen () {
			if (controls.requestFullscreen) {
				controls.requestFullscreen();
			} else if (controls.webkitRequestFullscreen) { /* Safari */
				controls.webkitRequestFullscreen();
			} else if (document.mozRequestFullScreen) { /* Firefox */
				document.mozRequestFullScreen();
			} else if (controls.msRequestFullscreen) { /* IE11 */
				controls.msRequestFullscreen();	
			}
		}
		function exitFullscreen () {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) { /* Safari */
				document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) { /* Firefox */
				document.mozCancelFullScreen();
			} else if (document.msExitFullscreen) { /* IE11 */
				document.msExitFullscreen();	
			}
		}
		function toggleFullscreen () {
			if (controls.classList.contains('vjs-fullscreen')) {
				exitFullscreen ();
				controls.focus();
			} else {
				requestFullscreen ();
				video.focus();
			}
		}
		fullscreenButton.addEventListener('click', function (event) {
			event.stopPropagation();
			toggleFullscreen ();
		}, true);
		
		document.addEventListener('fullscreenchange', fullscreenChange);
		document.addEventListener('mozfullscreenchange', fullscreenChange);
		document.addEventListener('MSFullscreenChange', fullscreenChange);
		document.addEventListener('webkitfullscreenchange', fullscreenChange);
		
		function fullscreenChange () {
			if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
				controls.classList.add('vjs-fullscreen');
				fullscreenButton.title = 'Exit Fullscreen';
			} else {
				controls.classList.remove('vjs-fullscreen');
				fullscreenButton.title = 'Fullscreen';
			}
		}
		
		//Picture in picture
		if (PIPButton !== undefined) {
			if ('pictureInPictureEnabled' in document) {
				PIPButton.classList.remove('vjs-disabled');
				PIPButton.disabled = false;
			} else {
				PIPButton.classList.add('vjs-disabled');
				PIPButton.disabled = true;
			}

			PIPButton.addEventListener('click', function (event) {
				event.stopPropagation();
				if (controls.classList.contains('vjs-picture-in-picture')) {
					document.exitPictureInPicture();
				} else {
					video.requestPictureInPicture();
				}
				controls.focus();
			}, true);

			video.addEventListener('enterpictureinpicture', function () {
				controls.classList.add('vjs-picture-in-picture');
				PIPButton.title = 'Exit Picture-in-Picture';
			});

			video.addEventListener('leavepictureinpicture', function () {
				controls.classList.remove('vjs-picture-in-picture');
				PIPButton.title = 'Picture-in-Picture';
			});
		}
		
		//Hotkeys
		/*controls.addEventListener('touchend',function (event) {
			//event.preventDefault();
			if (!controls.classList.contains('vjs-has-started')){
				controls.classList.add('vjs-has-started');
				play ();
			}
		}, false);*/
		controls.addEventListener('click', function () {
			if (!controls.classList.contains('vjs-has-started')){
				controls.classList.add('vjs-has-started');
				play ();
			} /*else {
				togglePlayback ();
			}*/
		}, false);
		progressHolder.addEventListener('click', function (event) {
			event.stopPropagation();
		}, true);
		
		controls.addEventListener('keydown', function (event) {
			let keyCode = event.which || event.keyCode;
			if (keyCode == 32) {
				togglePlayback ();
				event.preventDefault();
			} else if (keyCode == 70) {
				toggleFullscreen ();
				event.preventDefault();
			} else if (keyCode == 37) {
				video.currentTime = video.currentTime - 5;
				event.preventDefault();
			} else if (keyCode == 39) {
				video.currentTime = video.currentTime + 5;
				event.preventDefault();
			} else if (keyCode == 38) {
				video.currentTime = video.currentTime + 15;
				event.preventDefault();
			} else if (keyCode == 40) {
				video.currentTime = video.currentTime - 15;
				event.preventDefault();
			}
		});
		
		//Helper Functions
		function play () {
			playing = true;
			startBuffer ();
		}
		
		function pause () {
			playing = false;
			video.pause();
		}
		
		video.addEventListener('play', function () {
			playing = true;
			playButton.classList.remove('vjs-paused');
			playButton.classList.add('vjs-playing');
			controls.classList.remove('vjs-paused');
			controls.classList.add('vjs-playing');
			if (controls.classList.contains('vjs-ended')) {
				controls.classList.remove('vjs-ended');
				playButton.classList.remove('vjs-ended');
			}
			startBuffer ();
		});
		
		video.addEventListener('pause', function () {
			playButton.classList.remove('vjs-playing');
			playButton.classList.add('vjs-paused');
			controls.classList.remove('vjs-playing');
			controls.classList.add('vjs-paused');
			if (this.currentTime == this.duration) {
				controls.classList.add('vjs-ended');
				playButton.classList.add('vjs-ended');
			}
		});
		
		function togglePlayback () {
			if (controls.classList.contains('vjs-playing')) {
				pause();
			} else {
				play ();
			}
		}
		
		function startBuffer () {
			function addCheckBuffer () {
				buffering = true;
				controls.classList.add('vjs-seeking');
				video.addEventListener ('progress', checkBuffer);
				video.addEventListener ('play', checkBuffer);
				video.addEventListener ('timeupdate', checkBuffer);
			}
			if (!buffering) {
				if (video.buffered.length == 0) {
					addCheckBuffer ();
				} else {
					for (var i = video.buffered.length - 1; i >= 0; i--) {
						if (video.buffered.start(i) <= video.currentTime) {
							if (video.buffered.end(i) < Math.min(video.currentTime+15, video.duration)) {
								addCheckBuffer ();
							} else {
								if (playing)
									video.play();
							}
							break;
						}
					}
				}
			}
		}

		function checkBuffer () {
			if (!video.paused && video.readyState > 2) {
				video.pause();
			}
			for (var i = video.buffered.length - 1; i >= 0; i--) {
				if (video.buffered.start(i) <= video.currentTime) {
					if (video.buffered.end(i) >= Math.min(video.currentTime+14.9, video.duration)) {
						video.removeEventListener ('progress', checkBuffer);
						video.removeEventListener ('play', checkBuffer);
						video.removeEventListener ('timeupdate', checkBuffer);
						controls.classList.remove('vjs-seeking');
						buffering = false;
						if (playing)
							video.play();
					}
					break;
				}
			}
		}
		
		function addMultipleEventListeners (elem, types, callback, useCapture) {
			for (var i = 0; i < types.length; i++) {
				elem.addEventListener (types[i], function (event) {
					callback();
				}, useCapture===undefined?false:useCapture);
			}
		}
	}
}