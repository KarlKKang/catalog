// JavaScript Document

function videojs_mod (controls, config) {
	if (!config) {
		config = {};
	}
	this.controls = controls;
	this.isVideo = !(config.audio);
	this.useNative = config.useNative;
	this.elem = {};
	this.event = {};
	let t = this;
	
	if (this.isVideo) {
		this.media = this.controls.getElementsByTagName('video')[0];
	} else {
		this.media = this.controls.getElementsByTagName('audio')[0];
	}

    this.controls.addEventListener('contextmenu', event => event.preventDefault());

    //State variables
    this.playing = false;
    this.buffering = false;
    this.dragging = false;

    //Elements
    this.elem.controlBar = this.controls.getElementsByClassName('vjs-control-bar')[0];
    this.elem.playButton = this.elem.controlBar.getElementsByClassName('vjs-play-control')[0];
    this.elem.durationDisplay = this.elem.controlBar.getElementsByClassName('vjs-duration')[0].getElementsByClassName('vjs-duration-display')[0];
    this.elem.currentTimeDisplay = this.elem.controlBar.getElementsByClassName('vjs-current-time')[0].getElementsByClassName('vjs-current-time-display')[0];
    this.elem.progressControl = this.elem.controlBar.getElementsByClassName('vjs-progress-control')[0];
    this.elem.progressHolder = this.elem.progressControl.getElementsByClassName('vjs-progress-holder')[0];
    this.elem.progressBar = this.elem.progressHolder.getElementsByClassName('vjs-play-progress')[0];
    this.elem.progressMouseDisplay = this.elem.progressHolder.getElementsByClassName('vjs-mouse-display')[0];
    if (this.elem.progressMouseDisplay) {
        this.elem.progressTooltip = this.elem.progressMouseDisplay.getElementsByClassName('vjs-time-tooltip')[0];
	}
	if (this.isVideo) {
		this.elem.loadProgress = this.elem.progressHolder.getElementsByClassName('vjs-load-progress')[0];
		this.elem.fullscreenButton = this.elem.controlBar.getElementsByClassName('vjs-fullscreen-control')[0];
		this.elem.PIPButton = this.elem.controlBar.getElementsByClassName('vjs-picture-in-picture-control')[0];
	}
    

    //Fluid resize and duration
	this.event.initialize = function () {
		if (t.isVideo) {
			if (!t.useNative) {
				t.media.pause();
				t.startBuffer ();
			}
			let width = t.media.videoWidth, height = t.media.videoHeight;
			t.controls.style.paddingTop = height/width*100 + '%';
		}
		t.elem.durationDisplay.innerHTML = secToTimestamp (t.media.duration);
	};
    this.media.addEventListener('loadedmetadata', event => this.event.initialize(event));

    //Load progress
	if (this.isVideo) {
		this.event.showLoadProgress = function () {
			let bufferEnd = 0;
			for (var i = t.media.buffered.length - 1; i >= 0; i--) {
				if (t.media.buffered.start(i) <= t.media.currentTime) {
					bufferEnd = t.media.buffered.end(i);
					break;
				}
			}
			t.elem.loadProgress.style.width = bufferEnd / t.media.duration * 100 + '%';
		};
		this.media.addEventListener('progress', event => this.event.showLoadProgress(event));
	}
	

    //Loading
	if (this.isVideo) {
		this.event.showLoading = function () {
			t.controls.classList.add('vjs-seeking');
			if (!t.useNative)
				t.media.pause();
		};
		this.media.addEventListener('waiting', event => this.event.showLoading(event));

		this.event.loadingFinished = function () {
			if (t.useNative) {
				t.controls.classList.remove('vjs-seeking');
			} else {
				if (!t.buffering)
					t.controls.classList.remove('vjs-seeking');
				if (t.playing)
					t.play();
			}
		};
		this.media.addEventListener('canplaythrough', event => this.event.loadingFinished(event));
	}

    //Big play button
	if (this.isVideo) {
		this.elem.bigPlayButton = this.controls.getElementsByClassName('vjs-big-play-button')[0];
		this.event.initialStart = function (event) {
			event.stopPropagation();
			t.controls.classList.add('vjs-has-started');
			t.play ();
			t.controls.focus();
		};
		this.elem.bigPlayButton.addEventListener('click', event => this.event.initialStart(event), true);
	}

    //Play button
	this.event.playButtonClicked = function (event) {
		event.stopPropagation();
        if (t.controls.classList.contains('vjs-ended')) {
            t.controls.classList.remove('vjs-ended');
            t.elem.playButton.classList.remove('vjs-ended');
            t.media.currentTime = 0;
            t.play();
        } else {
            t.togglePlayback ();
        }
        t.controls.focus();
	};
    this.elem.playButton.addEventListener('click', event => this.event.playButtonClicked(event), true);

    //Progress bar 
    this.event.countdown = 3000;
	this.event.progressBarUpdate = function () {
		t.elem.currentTimeDisplay.innerHTML = secToTimestamp (t.media.currentTime);
        if (!t.dragging && t.media.duration)
            t.elem.progressBar.style.width = t.media.currentTime/t.media.duration*100 + '%';
		if (t.isVideo) {
			if (t.event.countdown > 0) {
				t.event.countdown -= 300;
				if (t.event.countdown == 0) {
					t.controls.classList.remove('vjs-user-active');
					t.controls.classList.add('vjs-user-inactive');
				}
			}
		}
	};
    setInterval (function () {
		t.event.progressBarUpdate();
	}, 300);
	
	if (this.isVideo) {
		this.event.userActivity = function () {
			t.controls.classList.remove('vjs-user-inactive');
			t.controls.classList.add('vjs-user-active');
			t.event.countdown = 3000;
		};
		addMultipleEventListeners (this.controls, ['mousemove', 'click', 'touchend'], this.event.userActivity, false);
	}
    

    //Progress bar drag
	this.event.progressBarDragStart = function () {
		t.dragging = true;
        if (t.controls.classList.contains('vjs-ended')) {
            t.controls.classList.remove('vjs-ended');
            t.elem.playButton.classList.remove('vjs-ended');
        }
	};
    addMultipleEventListeners (this.elem.progressControl, ['mousedown', 'touchstart'], this.event.progressBarDragStart);
	
	this.event.progressBarDragEnd = function (event) {
		if (t.dragging) {
            t.dragging = false;

            let mouseX;
            if (event.type == 'touchend') {
                let touch = event.touches[0] || event.changedTouches[0];
                mouseX = touch.clientX;
            } else {
                mouseX = event.clientX;
            }
            let position = t.elem.progressHolder.getBoundingClientRect();
            let totalLength = position.right-position.left;
            let leftPadding = Math.min(Math.max(mouseX-position.left, 0), totalLength);
            let percentage = leftPadding/totalLength;
            let currentTime = t.media.duration*percentage;

            if (currentTime == t.media.duration) {
                t.controls.classList.add('vjs-ended');
                t.elem.playButton.classList.add('vjs-ended');
            }

            t.media.currentTime = currentTime;
            t.controls.focus();
        }
	};
    addMultipleEventListeners (document, ['mouseup', 'touchend'], this.event.progressBarDragEnd);
	


    //Progress bar mouse display
	this.event.progressBarMouseDisplay = function (event) {  
        let mouseX;
        if (event.type == 'touchmove') {
			event.preventDefault();
            let touch = event.touches[0] || event.changedTouches[0];
            mouseX = touch.clientX;
        } else {
            mouseX = event.clientX;
        }
        let position = t.elem.progressHolder.getBoundingClientRect();
        let totalLength = position.right-position.left;
        let leftPadding = Math.min(Math.max(mouseX-position.left, 0), totalLength);
        let percentage = leftPadding/totalLength;
        let currentTime = t.media.duration*percentage;
        if (t.elem.progressMouseDisplay) {
            t.elem.progressMouseDisplay.style.left = leftPadding + 'px';
            t.elem.progressTooltip.innerHTML = secToTimestamp(currentTime);
            t.elem.progressTooltip.style.right = -t.elem.progressTooltip.offsetWidth/2 + 'px';
			if (currentTime > t.media.currentTime) {
				t.elem.progressMouseDisplay.style.backgroundColor = 'black';
			} else {
				t.elem.progressMouseDisplay.style.backgroundColor = 'white';
			}
        }
        if (t.dragging) {
            t.media.currentTime = currentTime;
            t.elem.progressBar.style.width = percentage*100 + '%';
        }
	};
    addMultipleEventListeners (this.elem.progressControl, ['mousemove', 'touchmove'], this.event.progressBarMouseDisplay);
	

    //Fullscreen
	if (this.isVideo) {
		this.requestFullscreen = function () {
			if (t.controls.requestFullscreen) {
				t.controls.requestFullscreen();
			} else if (t.controls.mozRequestFullScreen) { /* Firefox */
				t.controls.mozRequestFullScreen();
			} else if (t.controls.msRequestFullscreen) { /* IE11 */
				t.controls.msRequestFullscreen();	
			} else if (t.controls.webkitRequestFullscreen && !IS_IPAD) { /* Safari */
				t.controls.webkitRequestFullscreen();
			} else if (t.media.webkitEnterFullscreen) { /* iPhone */
				t.media.webkitEnterFullscreen();
			}
			t.controls.focus();
		};
		this.exitFullscreen = function () {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			} else if (document.webkitExitFullscreen) { /* Safari */
				document.webkitExitFullscreen();
			} else if (document.mozCancelFullScreen) { /* Firefox */
				document.mozCancelFullScreen();
			} else if (document.msExitFullscreen) { /* IE11 */
				document.msExitFullscreen();	
			}
			t.controls.focus();
		};
		this.toggleFullscreen = function () {
			if (t.controls.classList.contains('vjs-fullscreen')) {
				t.exitFullscreen ();	
			} else {
				t.requestFullscreen ();
			}
		};

		this.event.fullscreenButtonClick = function (event) {
			event.stopPropagation();
			t.toggleFullscreen ();
		};
		this.elem.fullscreenButton.addEventListener('click', event => this.event.fullscreenButtonClick(event), true);

		this.event.fullscreenChange = function () {
			if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
				t.controls.classList.add('vjs-fullscreen');
				t.elem.fullscreenButton.title = 'Exit Fullscreen';
			} else {
				t.controls.classList.remove('vjs-fullscreen');
				t.elem.fullscreenButton.title = 'Fullscreen';
			}
		};
		document.addEventListener('fullscreenchange', event => this.event.fullscreenChange(event));
		document.addEventListener('mozfullscreenchange', event => this.event.fullscreenChange(event));
		document.addEventListener('MSFullscreenChange', event => this.event.fullscreenChange(event));
		document.addEventListener('webkitfullscreenchange', event => this.event.fullscreenChange(event));
	}

    //Picture in picture
    if (this.isVideo && this.elem.PIPButton) {
        if ('pictureInPictureEnabled' in document) {
            t.elem.PIPButton.classList.remove('vjs-disabled');
            t.elem.PIPButton.disabled = false;
        } else {
            t.elem.PIPButton.classList.add('vjs-disabled');
            t.elem.PIPButton.disabled = true;
        }
		
		this.event.PIPButtonClicked = function (event) {
			event.stopPropagation();
            if (t.controls.classList.contains('vjs-picture-in-picture')) {
                document.exitPictureInPicture();
            } else {
                t.media.requestPictureInPicture();
            }
            t.controls.focus();
		};
        this.elem.PIPButton.addEventListener('click', event => this.event.PIPButtonClicked(event), true);
		
		this.event.enterPIP = function () {
			t.controls.classList.add('vjs-picture-in-picture');
            t.elem.PIPButton.title = 'Exit Picture-in-Picture';
		};
        this.media.addEventListener('enterpictureinpicture', event => this.event.enterPIP(event));
		
		this.event.leavePIP = function () {
			t.controls.classList.remove('vjs-picture-in-picture');
            t.elem.PIPButton.title = 'Picture-in-Picture';
		};
        this.media.addEventListener('leavepictureinpicture', event => this.event.leavePIP(event));
    }

    //Hotkeys
	if (this.isVideo) {
		/*controls.addEventListener('touchend',function (event) {
			//event.preventDefault();
			if (!controls.classList.contains('vjs-has-started')){
				controls.classList.add('vjs-has-started');
				play ();
			}
		}, false);*/
		this.event.clickedToStart = function () {
			if (!t.controls.classList.contains('vjs-has-started')){
				t.controls.classList.add('vjs-has-started');
				t.play();
			} /*else {
				togglePlayback ();
			}*/
		};
		this.controls.addEventListener('click', event => this.event.clickedToStart(event), false);
		/*
		this.elem.progressHolder.addEventListener('click', function (event) {
			event.stopPropagation();
		}, true);*/
	}
	
	if (this.isVideo) {
		this.event.hotkeys = function () {
			let keyCode = event.which || event.keyCode;
			if (keyCode == 32) {
				t.togglePlayback ();
				event.preventDefault();
			} else if (keyCode == 70) {
				t.toggleFullscreen ();
				event.preventDefault();
			} else if (keyCode == 37) {
				t.media.currentTime = t.media.currentTime - 5;
				event.preventDefault();
			} else if (keyCode == 39) {
				t.media.currentTime = t.media.currentTime + 5;
				event.preventDefault();
			} else if (keyCode == 38) {
				t.media.currentTime = t.media.currentTime + 15;
				event.preventDefault();
			} else if (keyCode == 40) {
				t.media.currentTime = t.media.currentTime - 15;
				event.preventDefault();
			}
		};
		this.controls.addEventListener('keydown', event => this.event.hotkeys(event), true);
	}
	

    //Helper Functions
	this.play = function () {
		if (t.isVideo && !t.useNative) {
			t.playing = true;
			t.startBuffer();
		} else {
			t.media.play();
		}
	};
	
	this.pause = function () {
		if (t.isVideo && !t.useNative) {
			t.playing = false;
		}
		t.media.pause();
	};
	
	this.event.onPlay = function () {
        t.elem.playButton.classList.remove('vjs-paused');
        t.elem.playButton.classList.add('vjs-playing');
        t.controls.classList.remove('vjs-paused');
        t.controls.classList.add('vjs-playing');
        if (t.controls.classList.contains('vjs-ended')) {
            t.controls.classList.remove('vjs-ended');
            t.elem.playButton.classList.remove('vjs-ended');
        }
		if (t.isVideo && !t.useNative) {
			t.playing = true;
			t.startBuffer ();
		}
	};
    this.media.addEventListener('play', event => this.event.onPlay(event));

	this.event.onPause = function () {
		t.elem.playButton.classList.remove('vjs-playing');
        t.elem.playButton.classList.add('vjs-paused');
        t.controls.classList.remove('vjs-playing');
        t.controls.classList.add('vjs-paused');
        if (t.media.currentTime == t.media.duration) {
            t.controls.classList.add('vjs-ended');
            t.elem.playButton.classList.add('vjs-ended');
        }
	};
    this.media.addEventListener('pause', event => this.event.onPause(event));
	
	this.event.onEnded = function () {
        t.controls.classList.add('vjs-ended');
        t.elem.playButton.classList.add('vjs-ended');
	};
    this.media.addEventListener('ended', event => this.event.onEnded(event));

    this.togglePlayback = function () {
        if (t.controls.classList.contains('vjs-playing')) {
            t.pause();
        } else {
            t.play();
        }
    };
	
	this.checkBuffer = function (event) {
        if (event.type == 'play' || event.type == 'timeupdate') {
            t.media.pause();
        }
        for (var i = t.media.buffered.length - 1; i >= 0; i--) {
            if (t.media.buffered.start(i) <= t.media.currentTime) {
                if (t.media.buffered.end(i) >= Math.min(t.media.currentTime+15, t.media.duration)) {
                    t.media.removeEventListener ('progress', t.checkBufferEventHandler);
                    t.media.removeEventListener ('play', t.checkBufferEventHandler);
                    t.media.removeEventListener ('timeupdate', t.checkBufferEventHandler);
                    t.controls.classList.remove('vjs-seeking');
                    t.buffering = false;
                    if (t.playing)
                        t.media.play();
                }
                break;
            }
        }
    };
	this.checkBufferEventHandler = function (event) {
		t.checkBuffer(event);
	};
	
    this.startBuffer = function () {
        function addCheckBuffer () {
			if (!t.media.paused && t.media.readyState>2) {
				t.media.pause();
			}
            t.buffering = true;
            t.controls.classList.add('vjs-seeking');
            t.media.addEventListener ('progress', t.checkBufferEventHandler);
            t.media.addEventListener ('play', t.checkBufferEventHandler);
            t.media.addEventListener ('timeupdate', t.checkBufferEventHandler);
        }
        if (!t.buffering) {
            if (t.media.buffered.length == 0) {
                addCheckBuffer ();
            } else {
                for (var i = t.media.buffered.length - 1; i >= 0; i--) {
                    if (t.media.buffered.start(i) <= t.media.currentTime) {
                        if (t.media.buffered.end(i) < Math.min(t.media.currentTime+14.9, t.media.duration)) {
                            addCheckBuffer ();
                        } else {
                            if (t.playing)
                                t.media.play();
                        }
                        break;
                    }
                }
            }
        }
    };
	
	this.currentTime = function (time) {
		this.media.currentTime = time;
	};

    function addMultipleEventListeners (elem, types, callback, useCapture) {
        for (var i = 0; i < types.length; i++) {
            elem.addEventListener (types[i], event => callback(event), useCapture===undefined?false:useCapture);
        }
    }
}