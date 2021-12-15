// JavaScript Document

var videojs_mod = (controls_ext, config_ext) => (function (controls, config) {
	var that = {};
	
	if (!config) {
		config = {};
	}
	const isVideo = !(config.audio);
	const useNative = config.useNative;
	
	var media = isVideo ? controls.getElementsByTagName('video')[0] : controls.getElementsByTagName('audio')[0];

    controls.addEventListener('contextmenu', event => event.preventDefault());
	
    //Elements
    var controlBar = controls.getElementsByClassName('vjs-control-bar')[0];
    var playButton = controlBar.getElementsByClassName('vjs-play-control')[0];
    var durationDisplay = controlBar.getElementsByClassName('vjs-duration')[0].getElementsByClassName('vjs-duration-display')[0];
    var currentTimeDisplay = controlBar.getElementsByClassName('vjs-current-time')[0].getElementsByClassName('vjs-current-time-display')[0];
    var progressControl = controlBar.getElementsByClassName('vjs-progress-control')[0];
    var progressHolder = progressControl.getElementsByClassName('vjs-progress-holder')[0];
    var progressBar = progressHolder.getElementsByClassName('vjs-play-progress')[0];
    var progressMouseDisplay = progressHolder.getElementsByClassName('vjs-mouse-display')[0];
    if (progressMouseDisplay) {
        var progressTooltip = progressMouseDisplay.getElementsByClassName('vjs-time-tooltip')[0];
	}
	if (isVideo) {
		var loadProgress = progressHolder.getElementsByClassName('vjs-load-progress')[0];
		var fullscreenButton = controlBar.getElementsByClassName('vjs-fullscreen-control')[0];
		var PIPButton = controlBar.getElementsByClassName('vjs-picture-in-picture-control')[0];
	}
    

    //Fluid resize and duration
    media.addEventListener('loadedmetadata', function () {
		if (isVideo) {
			if (!useNative) {
				media.pause();
				startBuffer ();
			}
			let width = media.videoWidth, height = media.videoHeight;
			controls.style.paddingTop = height/width*100 + '%';
		}
		durationDisplay.innerHTML = secToTimestamp (media.duration);
	});

    //Load progress
	if (isVideo) {
		media.addEventListener('progress', function () {
			let bufferEnd = 0;
			for (var i = media.buffered.length - 1; i >= 0; i--) {
				if (media.buffered.start(i) <= media.currentTime) {
					bufferEnd = media.buffered.end(i);
					break;
				}
			}
			loadProgress.style.width = bufferEnd / media.duration * 100 + '%';
		});
	}
	

    //Loading
	if (isVideo) {
		media.addEventListener('waiting', function () {
			onScreenConsoleOutput ('Playback entered waiting state.');
			controls.classList.add('vjs-seeking');
			if (!useNative)
				media.pause();
		});

		media.addEventListener('canplaythrough', function () {
			onScreenConsoleOutput ('Playback can play through.');
			if (useNative) {
				controls.classList.remove('vjs-seeking');
			} else {
				if (!that.buffering)
					controls.classList.remove('vjs-seeking');
				if (that.playing)
					play();
			}
		});
	}

    //Big play button
	if (isVideo) {
		var bigPlayButton = controls.getElementsByClassName('vjs-big-play-button')[0];
		bigPlayButton.addEventListener('click', function (event) {
			event.stopPropagation();
			controls.classList.add('vjs-has-started');
			play();
			controls.focus();
		}, true);
	}

    //Play button
    playButton.addEventListener('click', function (event) {
		event.stopPropagation();
        if (controls.classList.contains('vjs-ended')) {
            controls.classList.remove('vjs-ended');
            playButton.classList.remove('vjs-ended');
            media.currentTime = 0;
            play();
        } else {
            togglePlayback ();
        }
        controls.focus();
	}, true);

    //Progress bar & frame drop monitor
	that.inactiveCountdown = 3000;
	that.droppedFrames = 0;
	that.corruptedFrames = 0;
    setInterval (function () {
		currentTimeDisplay.innerHTML = secToTimestamp (media.currentTime);
        if (!that.dragging && media.duration)
            progressBar.style.width = media.currentTime/media.duration*100 + '%';
		if (isVideo) {
			if (that.inactiveCountdown > 0) {
				that.inactiveCountdown -= 300;
				if (that.inactiveCountdown == 0) {
					controls.classList.remove('vjs-user-active');
					controls.classList.add('vjs-user-inactive');
				}
			}
		}
		if (isVideo && typeof media.getVideoPlaybackQuality === "function") {
			var quality = media.getVideoPlaybackQuality();
			if (quality.droppedVideoFrames && quality.droppedVideoFrames != that.droppedFrames) {
				onScreenConsoleOutput ('Frame drop detected. Total dropped: ' + quality.droppedVideoFrames);
				that.droppedFrames = quality.droppedVideoFrames;
			}
			if (quality.corruptedVideoFrames && quality.corruptedVideoFrames != that.corruptedFrames) {
				onScreenConsoleOutput ('Frame corruption detected. Total corrupted: ' + quality.corruptedVideoFrames);
				that.corruptedFrames = quality.corruptedVideoFrames;
			}
		}
	}, 300);
	
	if (isVideo) {
		addMultipleEventListeners (controls, ['mousemove', 'click', 'touchend'], function () {
			controls.classList.remove('vjs-user-inactive');
			controls.classList.add('vjs-user-active');
			that.inactiveCountdown = 3000;
		}, false);
	}
    

    //Progress bar drag
    addMultipleEventListeners (progressControl, ['mousedown', 'touchstart'], function () {
		that.dragging = true;
        if (controls.classList.contains('vjs-ended')) {
            controls.classList.remove('vjs-ended');
            playButton.classList.remove('vjs-ended');
        }
	});
	
    addMultipleEventListeners (document, ['mouseup', 'touchend'], function (event) {
		if (that.dragging) {
            that.dragging = false;

            let mouseX;
            if (event.type == 'touchend') {
                let touch = event.touches[0] || event.changedTouches[0];
                mouseX = touch.clientX;
            } else {
                mouseX = event.clientX;
            }
            let position = progressHolder.getBoundingClientRect();
            let totalLength = position.right-position.left;
            let leftPadding = Math.min(Math.max(mouseX-position.left, 0), totalLength);
            let percentage = leftPadding/totalLength;
            let currentTime = media.duration*percentage;

            if (currentTime == media.duration) {
                controls.classList.add('vjs-ended');
                playButton.classList.add('vjs-ended');
            }

            media.currentTime = currentTime;
            controls.focus();
        }
	});
	


    //Progress bar mouse display
    addMultipleEventListeners (progressControl, ['mousemove', 'touchmove'], function (event) {  
        let mouseX;
        if (event.type == 'touchmove') {
			event.preventDefault();
            let touch = event.touches[0] || event.changedTouches[0];
            mouseX = touch.clientX;
        } else {
            mouseX = event.clientX;
        }
        let position = progressHolder.getBoundingClientRect();
        let totalLength = position.right-position.left;
        let leftPadding = Math.min(Math.max(mouseX-position.left, 0), totalLength);
        let percentage = leftPadding/totalLength;
        let currentTime = media.duration*percentage;
        if (progressMouseDisplay) {
            progressMouseDisplay.style.left = leftPadding + 'px';
            progressTooltip.innerHTML = secToTimestamp(currentTime);
            progressTooltip.style.right = -progressTooltip.offsetWidth/2 + 'px';
			if (currentTime > media.currentTime) {
				progressMouseDisplay.style.backgroundColor = 'black';
			} else {
				progressMouseDisplay.style.backgroundColor = 'white';
			}
        }
        if (that.dragging) {
            media.currentTime = currentTime;
            progressBar.style.width = percentage*100 + '%';
        }
	});
	

    //Fullscreen
	function requestFullscreen () {
		if (controls.requestFullscreen) {
			controls.requestFullscreen();
		} else if (controls.mozRequestFullScreen) { /* Firefox */
			controls.mozRequestFullScreen();
		} else if (controls.msRequestFullscreen) { /* IE11 */
			controls.msRequestFullscreen();	
		} else if (controls.webkitRequestFullscreen && !IS_IPAD) { /* Safari */
			controls.webkitRequestFullscreen();
		} else if (media.webkitEnterFullscreen) { /* iPhone and iPad */
			media.webkitEnterFullscreen();
		}
		controls.focus();
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
		controls.focus();
	}
	function toggleFullscreen () {
		if (controls.classList.contains('vjs-fullscreen')) {
			exitFullscreen ();	
		} else {
			requestFullscreen ();
		}
	}
	if (isVideo) {
		fullscreenButton.addEventListener('click', function (event) {
			event.stopPropagation();
			toggleFullscreen ();
		}, true);

		var fullscreenChange = function () {
			if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
				controls.classList.add('vjs-fullscreen');
				fullscreenButton.title = 'Exit Fullscreen';
			} else {
				controls.classList.remove('vjs-fullscreen');
				fullscreenButton.title = 'Fullscreen';
			}
		};
		document.addEventListener('fullscreenchange', event => fullscreenChange(event));
		document.addEventListener('mozfullscreenchange', event => fullscreenChange(event));
		document.addEventListener('MSFullscreenChange', event => fullscreenChange(event));
		document.addEventListener('webkitfullscreenchange', event => fullscreenChange(event));
	}

    //Picture in picture
    if (isVideo && PIPButton) {
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
                media.requestPictureInPicture();
            }
            controls.focus();
		}, true);
		
        media.addEventListener('enterpictureinpicture', function () {
			controls.classList.add('vjs-picture-in-picture');
            PIPButton.title = 'Exit Picture-in-Picture';
		});
		
        media.addEventListener('leavepictureinpicture', function () {
			controls.classList.remove('vjs-picture-in-picture');
            PIPButton.title = 'Picture-in-Picture';
		});
    }

    //Hotkeys
	if (isVideo) {
		controls.addEventListener('click', function () {
			if (!controls.classList.contains('vjs-has-started')){
				controls.classList.add('vjs-has-started');
				play();
			}
		});
	}
	
	if (isVideo) {
		controls.addEventListener('keydown', function () {
			let keyCode = event.which || event.keyCode;
			if (keyCode == 32) {
				togglePlayback ();
				event.preventDefault();
			} else if (keyCode == 70) {
				toggleFullscreen ();
				event.preventDefault();
			} else if (keyCode == 37) {
				media.currentTime = media.currentTime - 5;
				event.preventDefault();
			} else if (keyCode == 39) {
				that.seekingForward = true;
				media.currentTime = media.currentTime + 5;
				event.preventDefault();
			} else if (keyCode == 38) {
				that.seekingForward = true;
				media.currentTime = media.currentTime + 15;
				event.preventDefault();
			} else if (keyCode == 40) {
				media.currentTime = media.currentTime - 15;
				event.preventDefault();
			}
		}, true);
	}
	
	//Redundent
	media.addEventListener ('seeking', function () {
		onScreenConsoleOutput ('Seeking: ' + media.currentTime);
	});
	media.addEventListener ('seeked', function () {
		onScreenConsoleOutput ('Seeked: ' + media.currentTime);
	});

    //Helper Functions
	function play() {
		if (isVideo && !useNative) {
			that.playing = true;
			startBuffer();
		} else {
			media.play();
		}
	}
	
	function pause() {
		if (isVideo && !useNative) {
			that.playing = false;
		}
		media.pause();
	}
	
    media.addEventListener('play', function () {
		onScreenConsoleOutput ('Playback started.');
        playButton.classList.remove('vjs-paused');
        playButton.classList.add('vjs-playing');
        controls.classList.remove('vjs-paused');
        controls.classList.add('vjs-playing');
        if (controls.classList.contains('vjs-ended')) {
            controls.classList.remove('vjs-ended');
            playButton.classList.remove('vjs-ended');
        }
		if (isVideo && !useNative) {
			that.playing = true;
			startBuffer ();
		}
	});

    media.addEventListener('pause', function () {
		onScreenConsoleOutput ('Playback paused.');
		playButton.classList.remove('vjs-playing');
        playButton.classList.add('vjs-paused');
        controls.classList.remove('vjs-playing');
        controls.classList.add('vjs-paused');
        if (media.currentTime == media.duration) {
            controls.classList.add('vjs-ended');
            playButton.classList.add('vjs-ended');
        }
	});
	
    media.addEventListener('ended', function () {
        controls.classList.add('vjs-ended');
        playButton.classList.add('vjs-ended');
	});

    function togglePlayback() {
        if (controls.classList.contains('vjs-playing')) {
            pause();
        } else {
            play();
        }
    }
	
	function checkBuffer(event) {
        if (event && (event.type == 'play' || event.type == 'timeupdate')) {
            media.pause();
        }
        for (var i = media.buffered.length - 1; i >= 0; i--) {
            if (media.buffered.start(i) <= media.currentTime) {
				onScreenConsoleOutput ('Checking buffer range :' + media.buffered.start(i) + '-' + media.buffered.end(i) + '. Current time: ' + media.currentTime);
                if (media.buffered.end(i) >= Math.min(media.currentTime+15, media.duration)) {
                    media.removeEventListener ('progress', checkBuffer);
                    media.removeEventListener ('play', checkBuffer);
                    media.removeEventListener ('timeupdate', checkBuffer);
                    controls.classList.remove('vjs-seeking');
                    that.buffering = false;
					onScreenConsoleOutput ('Buffer complete!');
                    if (that.playing) {
						media.play();
					}  
                }
                break;
            }
        }
    }
	
    function startBuffer() {
        function addCheckBuffer () {
			/*if (!media.paused && media.readyState>2) {
				media.pause();
			}*/
            that.buffering = true;
            controls.classList.add('vjs-seeking');
            media.addEventListener ('progress', checkBuffer);
            media.addEventListener ('play', checkBuffer);
            media.addEventListener ('timeupdate', checkBuffer);
			checkBuffer();
        }
        if (!that.buffering) {
            if (media.buffered.length == 0) {
                addCheckBuffer ();
				onScreenConsoleOutput ('Buffer empty, start buffering.');
            } else {
                for (var i = media.buffered.length - 1; i >= 0; i--) {
                    if (media.buffered.start(i) <= media.currentTime) {
                        if (media.buffered.end(i) < Math.min(media.currentTime+14.9, media.duration)) {
                            addCheckBuffer ();
							onScreenConsoleOutput ('Buffer under threshold, start buffering.');
                        } else {
							onScreenConsoleOutput ('Buffer above threshold.');
                            if (that.playing && media.paused) {
								media.play();
							}
                        }
                        break;
                    }
                }
            }
        }
    }

    function addMultipleEventListeners (elem, types, callback, useCapture) {
        for (var i = 0; i < types.length; i++) {
            elem.addEventListener (types[i], event => callback(event), useCapture===undefined?false:useCapture);
        }
    }
	
	that.media = media;
	that.controls = controls;
	that.playing = false;
	that.buffering = false;
	that.dragging = false;
	that.seekingForward = false;
	that.play = play;
	that.pause = pause;
	
	return that;
})(controls_ext, config_ext);