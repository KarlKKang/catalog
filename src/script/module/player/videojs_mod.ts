// JavaScript Document
import {
    secToTimestamp,
	onScreenConsoleOutput,
	removeRightClick,
	message,

	insertBefore,
	addEventListener,
	getDescendantsByTagAt,
	getDescendantsByClassAt,
	getDescendantsByClass,
	addClass,
	removeClass,
	containsClass,
	addEventsListener,
	removeEventsListener,
	d,
	remove
} from '../main';
import Hls from 'hls.js';
import {default as videojs} from 'video.js';
import {IS_IOS} from './browser';
import screenfull from 'screenfull';

declare global {
	interface HTMLVideoElement {
		webkitEnterFullscreen?: () => void;
	}
}

export type VideojsModInstance = {
	_playing: boolean,
	_buffering: boolean,
	_dragging: boolean,
	_useNative: boolean,

	_attached: boolean,
	_hlsInstance: Hls | undefined,
	_videoJSInstance: videojs.Player | undefined,

	_inactiveCountdown: number,
	_droppedFrames: number,
	_corruptedFrames: number,

	_fragStart: number,

	media: HTMLVideoElement | HTMLAudioElement,
	controls: HTMLElement,
	play: () => void,
	pause: () => void,
	seek: (timestamp: number) => void,
	attachHls: (hlsInstance: Hls, url: string) => boolean,
	attachVideoJS: (videoJSInstance: videojs.Player, url: string) => boolean,
	attachNative: (url: string) => boolean,
	destroy: () => void,
}

export default function (oldControls: HTMLElement, instance: videojs.Player, config?: {audio?: boolean, mediaElemOverride?: HTMLVideoElement | HTMLAudioElement}) {
    var controls = oldControls.cloneNode(true) as HTMLElement;
    oldControls.id = '';

	insertBefore(controls, oldControls);
    instance.dispose();
	
	if (config === undefined) {
		config = {};
	}
	const isVideo = !(config.audio === true);
	
	var media: HTMLVideoElement | HTMLAudioElement;
	if (isVideo) {
		media = getDescendantsByTagAt(controls, 'video', 0) as HTMLVideoElement;
	} else {
		media = getDescendantsByTagAt(controls, 'audio', 0) as HTMLAudioElement;
	}

	if (config.mediaElemOverride !== undefined) {
		remove(media);
		media = config.mediaElemOverride;
	}

	removeRightClick(controls);

	var that: VideojsModInstance = {
		_playing: false,
		_buffering: false,
		_dragging: false,
		_useNative: true,

		_attached: false,
		_hlsInstance: undefined,
		_videoJSInstance: undefined,

		_inactiveCountdown: 3000,
		_droppedFrames: 0,
		_corruptedFrames: 0,

		_fragStart: 0,

		media: media,
		controls: controls,
		play: play,
		pause: pause,
		seek: seek,
		attachHls: attachHls,
		attachVideoJS: attachVideoJS,
		attachNative: attachNative,
		destroy: destroy,
	};
	
    //Elements
    var controlBar = getDescendantsByClassAt(controls, 'vjs-control-bar', 0) as HTMLElement;
    var playButton = getDescendantsByClassAt(controlBar, 'vjs-play-control', 0) as HTMLElement;
    var durationDisplay = getDescendantsByClassAt(getDescendantsByClassAt(controlBar, 'vjs-duration', 0), 'vjs-duration-display', 0) as HTMLElement;
    var currentTimeDisplay = getDescendantsByClassAt(getDescendantsByClassAt(controlBar, 'vjs-current-time', 0), 'vjs-current-time-display', 0) as HTMLElement;
    var progressControl = getDescendantsByClassAt(controlBar, 'vjs-progress-control', 0) as HTMLElement;
    var progressHolder = getDescendantsByClassAt(progressControl, 'vjs-progress-holder', 0) as HTMLElement;
    var progressBar = getDescendantsByClassAt(progressHolder, 'vjs-play-progress', 0) as HTMLElement;
    var progressMouseDisplay = getDescendantsByClass(progressHolder, 'vjs-mouse-display')[0] as HTMLElement | undefined;
	var progressTooltip: HTMLElement | undefined;
    if (progressMouseDisplay !== undefined) {
        progressTooltip = getDescendantsByClassAt(progressMouseDisplay, 'vjs-time-tooltip', 0) as HTMLElement;
	}
    

    //Fluid resize and duration
	addEventListener(media, 'loadedmetadata', function () {
		if (isVideo) {
			if (!that._useNative) {
				media.pause();
				startBuffer();
			}
			let videoMedia = media as HTMLVideoElement;
			let width = videoMedia.videoWidth, height = videoMedia.videoHeight;
			controls.style.paddingTop = height/width*100 + '%';
		}
		durationDisplay.innerHTML = secToTimestamp(media.duration);
	})

    
	if (isVideo) {
		//Load progress
		let loadProgress = getDescendantsByClassAt(progressHolder, 'vjs-load-progress', 0) as HTMLElement;
		addEventListener(media, 'progress', function () {
			let bufferEnd = 0;
			for (var i = media.buffered.length - 1; i >= 0; i--) {
				if (media.buffered.start(i) <= media.currentTime) {
					bufferEnd = media.buffered.end(i);
					break;
				}
			}
			(loadProgress as HTMLElement).style.width = bufferEnd / media.duration * 100 + '%';
		});

		addEventListener(media, 'waiting', function () {
			onScreenConsoleOutput ('Playback entered waiting state.');
			addClass(controls, 'vjs-seeking');
			if (!that._useNative)
				media.pause();
		});

		//Loading
		addEventListener(media, 'canplaythrough', function () {
			onScreenConsoleOutput ('Playback can play through.');
			if (that._useNative) {
				removeClass(controls, 'vjs-seeking');
			} else {
				if (!that._buffering) {
					removeClass(controls, 'vjs-seeking');
				}
				if (that._playing) {
					play();
				}
			}
		});

		//Big play button
		let bigPlayButton = getDescendantsByClassAt(controls, 'vjs-big-play-button', 0) as HTMLElement;
		addEventListener(bigPlayButton, 'click', function (event) {
			event.stopPropagation();
			addClass(controls, 'vjs-has-started');
			play();
			bigPlayButton.blur();
		}, true);
	}

    //Play button
	addEventListener(playButton, 'click', function (event) {
		event.stopPropagation();
        if (containsClass(controls, 'vjs-ended')) {
			removeClass(controls, 'vjs-ended');
			removeClass(playButton, 'vjs-ended');
            seek(0);
            play();
        } else {
            togglePlayback ();
        }
        playButton.blur();
	}, true);

    //Progress bar & frame drop monitor
    setInterval (function () {
        if (!that._dragging && media.duration) {
			currentTimeDisplay.innerHTML = secToTimestamp (media.currentTime);
            progressBar.style.width = media.currentTime/media.duration*100 + '%';
			if (isVideo) {
				if (that._inactiveCountdown > 0) {
					that._inactiveCountdown -= 300;
					if (that._inactiveCountdown == 0) {
						removeClass(controls, 'vjs-user-active');
						addClass(controls, 'vjs-user-inactive');
					}
				}
			}
		} else {
			that._inactiveCountdown = 3000;
		}
		
		if (isVideo) {
			let videoMedia = media as HTMLVideoElement;
			if (typeof videoMedia.getVideoPlaybackQuality === "function") {
				var quality = videoMedia.getVideoPlaybackQuality();
				if (quality.droppedVideoFrames && quality.droppedVideoFrames != that._droppedFrames) {
					onScreenConsoleOutput ('Frame drop detected. Total dropped: ' + quality.droppedVideoFrames);
					that._droppedFrames = quality.droppedVideoFrames;
				}
				if (quality.corruptedVideoFrames && quality.corruptedVideoFrames != that._corruptedFrames) {
					onScreenConsoleOutput ('Frame corruption detected. Total corrupted: ' + quality.corruptedVideoFrames);
					that._corruptedFrames = quality.corruptedVideoFrames;
				}
			}
		}
	}, 300);
	
	if (isVideo) {
		addEventsListener(controls, ['mousemove', 'click'], function () {
			removeClass(controls, 'vjs-user-inactive');
			addClass(controls, 'vjs-user-active');
			that._inactiveCountdown = 3000;
		});
	}
    

    //Progress bar
    addEventsListener(progressControl, ['mousedown', 'touchstart'], function (event) {
		that._dragging = true;
		if (!media.paused) {
			media.pause();
			that._playing = true;
		}

		removeClass(controls, 'vjs-ended');
		removeClass(playButton, 'vjs-ended');
		
		changeProgress(event as MouseEvent | TouchEvent);
	});
	
    addEventsListener(d, ['mouseup', 'touchend'], function (event) {
		if (that._dragging) {
            that._dragging = false;

            let currentTime = changeProgress(event as MouseEvent | TouchEvent);
			seek(currentTime);

			if (isVideo && !that._useNative) {
				if (that._playing) {
					play();
				}
			} else if (that._playing) {
				media.play();
				that._playing = false;
			}
            progressControl.blur();
        }
	});
	
    addEventsListener(progressControl, ['mousemove', 'touchmove'], function (event) {  
        changeProgress(event as MouseEvent | TouchEvent);
	});

	function changeProgress (event: MouseEvent | TouchEvent) {
		let mouseX;
		if (event.type === 'touchmove') {
			let touchEvent = event as TouchEvent;
			let touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
			if (touch === undefined) {
				message.show(message.template.param.javascriptError('Failed to get TouchEvent data.'));
			}
			mouseX = (touch as Touch).clientX;
		} else {
			mouseX = (event as MouseEvent).clientX;
		}
		let position = progressHolder.getBoundingClientRect();
		let totalLength = position.right - position.left;
		let leftPadding = Math.min(Math.max(mouseX - position.left, 0), totalLength);
		let percentage = leftPadding / totalLength;
		let currentTime = media.duration * percentage;
		let currentTimestamp = secToTimestamp(currentTime);
		
        if (progressMouseDisplay !== undefined && progressTooltip !== undefined) {
            progressMouseDisplay.style.left = leftPadding + 'px';
            progressTooltip.innerHTML = currentTimestamp;
            progressTooltip.style.right = -progressTooltip.offsetWidth/2 + 'px';
			if (currentTime > media.currentTime) {
				removeClass(progressMouseDisplay, 'backward');
				addClass(progressMouseDisplay, 'forward');
			} else {
				removeClass(progressMouseDisplay, 'forward');
				addClass(progressMouseDisplay, 'backward');
			}
        }
        if (that._dragging) {
            //media.currentTime = currentTime;
			currentTimeDisplay.innerHTML = currentTimestamp;
            progressBar.style.width = percentage*100 + '%';
        }

		return currentTime;
	}
	
	if (isVideo) {
		let videoMedia = media as HTMLVideoElement;

		//Fullscreen
		let requestFullscreen = function () {
			if (IS_IOS && videoMedia.webkitEnterFullscreen) {
				videoMedia.webkitEnterFullscreen();
			} else {
				screenfull.request(controls);
			}
	
			controls.focus();
		};

		let exitFullscreen = function () {
			screenfull.exit();
			controls.focus();
		};

		let toggleFullscreen = function () {
			if (containsClass(controls, 'vjs-fullscreen')) {
				exitFullscreen ();
			} else {
				requestFullscreen ();
			}
		};

		let fullscreenButton = getDescendantsByClassAt(controlBar, 'vjs-fullscreen-control', 0) as HTMLButtonElement;

		if (screenfull.isEnabled || (IS_IOS && videoMedia.webkitEnterFullscreen)) {
			removeClass(fullscreenButton, 'vjs-disabled');
			fullscreenButton.disabled = false;

			addEventListener(fullscreenButton, 'click', function (event) {
				event.stopPropagation();
				toggleFullscreen ();
			}, true);
	
			let fullscreenChange = function () {
				let elemInFS = screenfull.element;
				if (elemInFS === undefined) {
					removeClass(controls, 'vjs-fullscreen');
					fullscreenButton.title = 'Fullscreen';
				} else if (elemInFS.isSameNode(controls) || elemInFS.isSameNode(videoMedia)) {
					addClass(controls, 'vjs-fullscreen');
					fullscreenButton.title = 'Exit Fullscreen';
				}
			};
			screenfull.on('change', fullscreenChange);	
		} else {
			addClass(fullscreenButton, 'vjs-disabled');
			fullscreenButton.disabled = true;
		}

		//Picture in picture
		let PIPButton = getDescendantsByClass(controlBar, 'vjs-picture-in-picture-control')[0];
		if (PIPButton !== undefined) {
			let PIPButtonCast = PIPButton as HTMLButtonElement;
			if (d.pictureInPictureEnabled) {
				removeClass(PIPButtonCast, 'vjs-disabled');
				PIPButtonCast.disabled = false;

				addEventListener(PIPButtonCast, 'click', function (event) {
					event.stopPropagation();
					if (containsClass(controls, 'vjs-picture-in-picture')) {
						d.exitPictureInPicture();
					} else {
						videoMedia.requestPictureInPicture();
					}
					PIPButtonCast.blur();
				}, true);

				addEventListener(videoMedia, 'enterpictureinpicture', function () {
					addClass(controls, 'vjs-picture-in-picture');
					PIPButtonCast.title = 'Exit Picture-in-Picture';
				});

				addEventListener(videoMedia, 'leavepictureinpicture', function () {
					removeClass(controls, 'vjs-picture-in-picture');
					PIPButtonCast.title = 'Picture-in-Picture';
				});
			} else {
				addClass(PIPButtonCast, 'vjs-disabled');
				PIPButtonCast.disabled = true;
			}
		}

		//Hotkeys		
		addEventListener(controls, 'click', function () {
			if (!containsClass(controls, 'vjs-has-started')){
				addClass(controls, 'vjs-has-started');
				play();
			}
		});

		addEventListener(controls, 'keydown', function (event) {
			let key = (event as KeyboardEvent).key;
			if (key === ' ' || key === 'Spacebar') {
				togglePlayback ();
				event.preventDefault();
			} else if (key === 'f' || key === 'F') {
				toggleFullscreen ();
				event.preventDefault();
			} else if (key === 'ArrowLeft' || key === 'Left') {
				seek(media.currentTime - 5);
				event.preventDefault();
			} else if (key === 'ArrowRight' || key === 'Right') {
				media.currentTime = media.currentTime + 5;
				event.preventDefault();
			} else if (key === 'ArrowUp' || key === 'Up') {
				media.currentTime = media.currentTime + 15;
				event.preventDefault();
			} else if (key === 'ArrowDown' || key === 'Down') {
				seek(media.currentTime - 15);
				event.preventDefault();
			}
		}, true);
	}
	
	//Redundent
	addEventListener(media, 'seeking', function () {
		onScreenConsoleOutput ('Seeking: ' + media.currentTime);
	});
	addEventListener(media, 'seeked', function () {
		onScreenConsoleOutput ('Seeked: ' + media.currentTime);
	});

    //Helper Functions
	function play() {
		if (isVideo && !that._useNative) {
			that._playing = true;
			startBuffer();
		} else {
			media.play();
		}
	}
	
	function pause() {
		if (isVideo && !that._useNative) {
			that._playing = false;
		}
		media.pause();
	}
	
	function seek (timestamp: number) {
		if (isVideo && that._hlsInstance !== undefined) {
			if (timestamp >= that._fragStart) {
				media.currentTime = timestamp;
				onScreenConsoleOutput ('Skipped buffer flushing.');
			} else {
				that._hlsInstance.once(Hls.Events.BUFFER_FLUSHED, function () {
					media.currentTime = timestamp;
					(that._hlsInstance as Hls).startLoad(timestamp);
					onScreenConsoleOutput ('Buffer reloaded.');
				});
				that._hlsInstance.trigger(Hls.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: null});
				onScreenConsoleOutput ('Buffer flushed.');
			}
		} else {
			media.currentTime = timestamp;
		}
	}

	addEventListener(media, 'play', function () {
		onScreenConsoleOutput ('Playback started.');
		removeClass(playButton, 'vjs-paused');
		addClass(playButton, 'vjs-playing');
		removeClass(controls, 'vjs-paused');
		addClass(controls, 'vjs-playing');
        if (containsClass(controls, 'vjs-ended')) {
			removeClass(controls, 'vjs-ended');
			removeClass(playButton, 'vjs-ended');
        }
		if (isVideo && !that._useNative) {
			that._playing = true;
			startBuffer ();
		}
	});

	addEventListener(media, 'pause', function () {
		onScreenConsoleOutput ('Playback paused.');
		removeClass(playButton, 'vjs-playing');
		addClass(playButton, 'vjs-paused');
		removeClass(controls, 'vjs-playing');
		addClass(controls, 'vjs-paused');
        if (media.currentTime == media.duration) {
			addClass(controls, 'vjs-ended');
			addClass(playButton, 'vjs-ended');
        }
	});

	addEventListener(media, 'ended', function () {
		addClass(controls, 'vjs-ended');
		addClass(playButton, 'vjs-ended');
	});

    function togglePlayback() {
        if (containsClass(controls, 'vjs-playing')) { 
            pause();
        } else {
            play();
        }
    }
	
	function checkBuffer(event?: Event) {
        if (event !== undefined && (event.type == 'play' || (!media.paused && event.type == 'timeupdate'))) {
            media.pause();
        }
        for (var i = media.buffered.length - 1; i >= 0; i--) {
            if (media.buffered.start(i) <= media.currentTime+0.05) {
				onScreenConsoleOutput ('Checking buffer range :' + media.buffered.start(i) + '-' + media.buffered.end(i) + '. Current time: ' + media.currentTime);
                if (media.buffered.end(i) >= Math.min(media.currentTime+15, media.duration-0.1)) {
					removeEventsListener(media, ['progress', 'play', 'timeupdate'], checkBuffer);
					removeClass(controls, 'vjs-seeking');
                    that._buffering = false;
					onScreenConsoleOutput ('Buffer complete!');
                    if (that._playing && !that._dragging) {
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
            that._buffering = true;
			addClass(controls, 'vjs-seeking');
			addEventsListener(media, ['progress', 'play', 'timeupdate'], checkBuffer);
			checkBuffer();
        }
        if (!that._buffering) {
            if (media.buffered.length == 0) {
                addCheckBuffer ();
				onScreenConsoleOutput ('Buffer empty, start buffering.');
            } else {
                for (var i = media.buffered.length - 1; i >= 0; i--) {
                    if (media.buffered.start(i) <= media.currentTime+0.05) {
                        if (media.buffered.end(i) < Math.min(media.currentTime+14.9, media.duration-0.1)) {
                            addCheckBuffer ();
							onScreenConsoleOutput ('Buffer under threshold, start buffering.');
                        } else {
							onScreenConsoleOutput ('Buffer above threshold.');
                            if (that._playing && media.paused && !that._dragging) {
								media.play();
							}
                        }
                        break;
                    }
                }
            }
        }
    }
	
	function attachHls (hlsInstance: Hls, url: string) {
		if (that._attached) {
			return false;
		}
		that._attached = true;
		that._useNative = false;
		that._hlsInstance = hlsInstance;
		hlsInstance.on(Hls.Events.FRAG_CHANGED, (_, data) => { 
			that._fragStart = data.frag.startDTS;
			onScreenConsoleOutput ('Fragment changed: ' + that._fragStart + '-' + data.frag.endDTS);
		});
		hlsInstance.attachMedia(media);
		hlsInstance.loadSource(url);
		media.volume = 1;
		onScreenConsoleOutput('HLS is attached.');
		return true;
	}

	function attachVideoJS (videoJSInstance: videojs.Player, url: string) {
		if (that._attached) {
			return false;
		}
		that._attached = true;
		that._useNative = false;
		that._videoJSInstance = videoJSInstance;
		videoJSInstance.src({
			src: url,
			type: 'application/vnd.apple.mpegurl'
		});
		videoJSInstance.volume(1);
		onScreenConsoleOutput ('VideoJS is attached.');
		return true;
	}

	function attachNative (url: string) {
		if (that._attached) {
			return false;
		}
		that._attached = true;
		media.src = url;
        media.load();
		media.volume = 1;
		return true;
	}

	function destroy () {
		if (!that._attached) {
			return;
		}
		if (that._hlsInstance !== undefined) {
			that._hlsInstance.destroy();
		} else if (that._videoJSInstance !== undefined) {
			that._videoJSInstance.dispose();
		} else {
			media.pause();
			media.removeAttribute('src');
			media.load();
		}
		that._attached = false;
	}
	
	that.media = media;
	that.controls = controls;
	that.play = play;
	that.pause = pause;
	that.seek = seek;
	that.attachHls = attachHls;
	that.attachVideoJS = attachVideoJS;
	that.attachNative = attachNative;
	that.destroy = destroy;
	
	return that;
};