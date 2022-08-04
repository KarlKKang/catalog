// JavaScript Document
import {
    secToTimestamp,
	removeRightClick,
} from '../main';
import {
	getById,
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
	w,
	remove
} from '../DOM';
import * as message from '../message';
import type Hls from 'hls.js';
import type {default as videojs} from 'video.js';
import {IS_IOS} from './browser';
import screenfull from 'screenfull';

declare global {
	interface HTMLVideoElement {
		webkitEnterFullscreen?: () => void,
		autoPictureInPicture?: boolean,
		playsinline?: boolean,
	}

	interface HTMLMediaElement {
		controlsList?: DOMTokenList
	}
}

export type VideojsModInstance = {
	_playing: boolean,
	_buffering: boolean,
	_dragging: boolean,
	_useNative: boolean,

	_attached: boolean,
	_hls: undefined | {
		instance: Hls,
		constructor: typeof Hls
	},
	_videoJSInstance: videojs.Player | undefined,

	_inactiveCountdown: number,
	_droppedFrames: number,
	_corruptedFrames: number,

	_fragStart: number,

	readonly media: HTMLVideoElement | HTMLAudioElement,
	readonly controls: HTMLElement,
	readonly play: () => void,
	readonly pause: () => void,
	readonly seek: (timestamp: number) => void,
	readonly attachHls: (hlsConstructor: typeof Hls, hlsInstance: Hls, url: string) => void,
	readonly attachVideojs: (url: string) => void,
	readonly attachNative: (url: string) => void,
	readonly destroy: () => void,
	readonly startBuffer: () => void
}

var DEBUG: boolean;
var IS_VIDEO: boolean;

export default function (instance: videojs.Player, config?: {audio?: boolean, videojsMediaOverrideInstance?: videojs.Player, debug?: boolean}) {
	let oldControls = instance.el();
    var controls = oldControls.cloneNode(true) as HTMLElement;
    oldControls.id = '';

	insertBefore(controls, oldControls);
    instance.dispose();
	
	if (config === undefined) {
		config = {};
	}

	IS_VIDEO = !(config.audio === true);
	DEBUG = config.debug === true;
	
	const videojsMediaOverrideInstance = config.videojsMediaOverrideInstance;
	const media = function () {
		var nativeMedia: HTMLVideoElement | HTMLAudioElement = (IS_VIDEO ? (getDescendantsByTagAt(controls, 'video', 0) as HTMLVideoElement) : (getDescendantsByTagAt(controls, 'audio', 0) as HTMLAudioElement));
		if (videojsMediaOverrideInstance !== undefined) {
			remove(nativeMedia);
			if (IS_VIDEO) {
				return getDescendantsByTagAt(videojsMediaOverrideInstance.el(), 'video', 0) as HTMLVideoElement;
			} else {
				return getDescendantsByTagAt(videojsMediaOverrideInstance.el(), 'audio', 0) as HTMLAudioElement
			}
		}
		return nativeMedia;
	} ();
	

	removeRightClick(controls);

	var that: VideojsModInstance = {
		_playing: false,
		_buffering: false,
		_dragging: false,
		_useNative: true,

		_attached: false,
		_hls: undefined,
		_videoJSInstance: videojsMediaOverrideInstance,

		_inactiveCountdown: 10,
		_droppedFrames: 0,
		_corruptedFrames: 0,

		_fragStart: 0,

		media: media,
		controls: controls,
		play: play,
		pause: pause,
		seek: seek,
		attachHls: attachHls,
		attachVideojs: attachVideojs,
		attachNative: attachNative,
		destroy: destroy,
		startBuffer: startBuffer
	};

	function play() {
		if (IS_VIDEO && !that._useNative) {
			that._playing = true;
			startBuffer();
		} else {
			media.play();
		}
	}
	
	function pause() {
		if (IS_VIDEO && !that._useNative) {
			that._playing = false;
		}
		media.pause();
	}
	
	function seek (timestamp: number) {
		if (IS_VIDEO && that._hls !== undefined) {
			if (timestamp >= that._fragStart) {
				media.currentTime = timestamp;
				onScreenConsoleOutput ('Skipped buffer flushing.');
			} else {
				let hlsInstance = that._hls.instance;
				let hlsConstructor = that._hls.constructor;
				hlsInstance.once(hlsConstructor.Events.BUFFER_FLUSHED, function () {
					media.currentTime = timestamp;
					hlsInstance.startLoad(timestamp);
					onScreenConsoleOutput ('Buffer reloaded.');
				});
				hlsInstance.trigger(hlsConstructor.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: null});
				onScreenConsoleOutput ('Buffer flushed.');
			}
		} else {
			media.currentTime = timestamp;
		}
	}
	
	function checkBuffer(event?: Event) {
		if (that._buffering === false) {
			return;
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
					return;
                } else {
					setTimeout(checkBuffer, 1000); // To prevent 'progress' event not firing sometimes
					break;
				}
            }
        }
		if (event !== undefined && (event.type == 'playing' || (!media.paused && event.type == 'timeupdate'))) {
			media.pause();
		}
    }
	
    function startBuffer() {
        function addCheckBuffer () {
			/*if (!media.paused && media.readyState>2) {
				media.pause();
			}*/
            that._buffering = true;
			addClass(controls, 'vjs-seeking');
			addEventsListener(media, ['progress', 'playing', 'timeupdate'], checkBuffer);
			checkBuffer();
        }

        if (that._buffering) {
			checkBuffer();
			return;
		}

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
                        if (that._playing && !that._dragging) {
							media.play();
						}
                    }
                    return;
                }
            }
        }
    }

	attachEventListeners(that);
	
	function attachHls (hlsConstructor: typeof Hls, hlsInstance: Hls, url: string) {
		if (that._attached) {
			throw new Error('The instance already has source attached.');
		}
		if (that._videoJSInstance !== undefined) {
			throw new Error('Cannot attach hls.js source to instances initialized with videojs override.');
		}

		that._attached = true;
		that._useNative = false;
		that._hls = {
			instance: hlsInstance,
			constructor: hlsConstructor
		};
		
		setMediaAttributes();
		hlsInstance.on(hlsConstructor.Events.FRAG_CHANGED, (_, data) => { 
			that._fragStart = data.frag.startDTS;
			onScreenConsoleOutput ('Fragment changed: ' + that._fragStart + '-' + data.frag.endDTS);
		});
		hlsInstance.attachMedia(media);
		hlsInstance.loadSource(url);
		media.volume = 1;
		onScreenConsoleOutput('HLS is attached.');
	}

	function attachVideojs (url: string) {
		if (that._attached) {
			throw new Error('The instance already has source attached.');
		}
		if (that._videoJSInstance === undefined) {
			throw new Error('Cannot attach videojs source to instances not been initialized with videojs override.');
		}

		that._attached = true;
		that._useNative = false;
		
		setMediaAttributes();
		that._videoJSInstance.src({
			src: url,
			type: 'application/vnd.apple.mpegurl'
		});
		that._videoJSInstance.volume(1);
		onScreenConsoleOutput ('VideoJS is attached.');
	}

	function attachNative (url: string) {
		if (that._attached) {
			throw new Error('The instance already has source attached.');
		}
		if (that._videoJSInstance !== undefined) {
			throw new Error('Cannot attach native source to instances initialized with videojs override.');
		}

		that._attached = true;
		that._useNative = true;
		
		media.crossOrigin = 'use-credentials';
		setMediaAttributes();

		media.src = url;
        media.load();
		media.volume = 1;
		onScreenConsoleOutput ('Native HLS is attached.');
	}

	function destroy () {
		if (!that._attached) {
			return;
		}
		if (that._hls !== undefined) {
			that._hls.instance.destroy();
			that._hls = undefined;
		} else if (that._videoJSInstance !== undefined) {
			that._videoJSInstance.reset();
		} else {
			media.pause();
			media.removeAttribute('src');
			media.load();
		}
		that._attached = false;
	}

	function setMediaAttributes () {
		if (typeof media.preload !== 'undefined') {
			media.preload = 'auto';
		}
		if (typeof media.controlsList !== 'undefined') {
			if (media.controlsList.supports('nodownload')) {
				media.controlsList.add('nodownload');
			}
			if (media.controlsList.supports('noplaybackrate')) {
				media.controlsList.add('noplaybackrate');
			}
		}
		
		if (media instanceof HTMLVideoElement) {
			if (typeof media.playsInline !== 'undefined') {
				media.playsInline = true;
			}
			if (typeof media.autoPictureInPicture !== 'undefined') {
				media.autoPictureInPicture = true;
			}
		}
	}
	
	return that;
};


function attachEventListeners (that: VideojsModInstance) {
	const media = that.media;
	const controls = that.controls;

	//helper
	function togglePlayback() {
        if (containsClass(controls, 'vjs-playing')) { 
            that.pause();
        } else {
            that.play();
        }
    }

	function resetToActive () {
		that._inactiveCountdown = 10;
		removeClass(controls, 'vjs-user-inactive');
		addClass(controls, 'vjs-user-active');
	}

	//Elements
	const controlBar = getDescendantsByClassAt(controls, 'vjs-control-bar', 0) as HTMLElement;
	const playButton = getDescendantsByClassAt(controlBar, 'vjs-play-control', 0) as HTMLElement;
	const currentTimeDisplay = getDescendantsByClassAt(getDescendantsByClassAt(controlBar, 'vjs-current-time', 0), 'vjs-current-time-display', 0) as HTMLElement;
	const progressControl = getDescendantsByClassAt(controlBar, 'vjs-progress-control', 0) as HTMLElement;
	const progressHolder = getDescendantsByClassAt(progressControl, 'vjs-progress-holder', 0) as HTMLElement;
	const progressBar = getDescendantsByClassAt(progressHolder, 'vjs-play-progress', 0) as HTMLElement;
	const progressMouseDisplay = getDescendantsByClass(progressHolder, 'vjs-mouse-display')[0] as HTMLElement | undefined;
	const progressTooltip = ((progressMouseDisplay === undefined) ? undefined : (getDescendantsByClassAt(progressMouseDisplay, 'vjs-time-tooltip', 0) as HTMLElement));
	const durationDisplay = getDescendantsByClassAt(getDescendantsByClassAt(controlBar, 'vjs-duration', 0), 'vjs-duration-display', 0) as HTMLElement;

	//Fluid resize and duration
	addEventListener(media, 'loadedmetadata', function () {
		if (IS_VIDEO) {
			if (!that._useNative) {
				media.pause();
				that.startBuffer();
			}
			// let videoMedia = media as HTMLVideoElement;
			// let width = videoMedia.videoWidth, height = videoMedia.videoHeight;
			// controls.style.paddingTop = height/width*100 + '%';
			controls.style.removeProperty('padding-top');
		}
		durationDisplay.innerHTML = secToTimestamp(media.duration);
	});

	addEventListener(media, 'durationchange', function () {
		durationDisplay.innerHTML = secToTimestamp(media.duration);
	})

	//Play button
	addEventListener(playButton, 'click', function (event) {
		event.stopPropagation();
		if (containsClass(controls, 'vjs-ended')) {
			removeClass(controls, 'vjs-ended');
			removeClass(playButton, 'vjs-ended');
			that.seek(0);
			that.play();
		} else {
			togglePlayback ();
		}
		playButton.blur();
	}, true);

	//Progress bar & frame drop monitor
	setInterval (function () {
		if (!that._dragging && media.duration) {
			currentTimeDisplay.innerHTML = secToTimestamp (media.currentTime);
			progressBar.style.width = Math.min(media.currentTime/media.duration*100, 100) + '%';
			if (IS_VIDEO) {
				if (that._inactiveCountdown > 0) {
					that._inactiveCountdown -= 1;
					if (that._inactiveCountdown == 0) {
						removeClass(controls, 'vjs-user-active');
						addClass(controls, 'vjs-user-inactive');
					}
				}
			}
		} else {
			resetToActive();
		}
		
		if (DEBUG && IS_VIDEO) {
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
			that.seek(currentTime);

			if (IS_VIDEO && !that._useNative) {
				if (that._playing) {
					that.play();
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
		if (w.TouchEvent !== undefined && event instanceof TouchEvent) {
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

	//Activity on media
	addEventListener(media, 'play', function () {
		onScreenConsoleOutput ('Playback started at ' + media.currentTime + '.');
		removeClass(playButton, 'vjs-paused');
		addClass(playButton, 'vjs-playing');
		removeClass(controls, 'vjs-paused');
		addClass(controls, 'vjs-playing');
        if (containsClass(controls, 'vjs-ended')) {
			removeClass(controls, 'vjs-ended');
			removeClass(playButton, 'vjs-ended');
        }
		if (IS_VIDEO && !that._useNative) {
			that._playing = true;
			that.startBuffer();
		}
	});

	addEventListener(media, 'pause', function () {
		onScreenConsoleOutput ('Playback paused.');
		removeClass(playButton, 'vjs-playing');
		addClass(playButton, 'vjs-paused');
		removeClass(controls, 'vjs-playing');
		addClass(controls, 'vjs-paused');
        if (media.currentTime >= media.duration) {
			addClass(controls, 'vjs-ended');
			addClass(playButton, 'vjs-ended');
			if (IS_VIDEO && !that._useNative) {
				that._playing = false;
			}
        }
	});

	addEventListener(media, 'ended', function () {
		addClass(controls, 'vjs-ended');
		addClass(playButton, 'vjs-ended');
		if (IS_VIDEO && !that._useNative) {
			that._playing = false;
		}
	});

	//Redundent
	addEventListener(media, 'seeking', function () {
		onScreenConsoleOutput ('Seeking: ' + media.currentTime);
	});
	addEventListener(media, 'seeked', function () {
		onScreenConsoleOutput ('Seeked: ' + media.currentTime);
	});

	//////////////////////////////////////////////////// Audio returns here ////////////////////////////////////////////////////
	if (!IS_VIDEO) {
		return;
	}

	const videoMedia = media as HTMLVideoElement;

	//UI activity
	addEventsListener(controls, ['mousemove', 'click', 'touchstart', 'touchmove', 'touchend'], resetToActive);

	//Big play button
	const bigPlayButton = getDescendantsByClassAt(controls, 'vjs-big-play-button', 0) as HTMLElement;
	addEventListener(bigPlayButton, 'click', function (event) {
		event.stopPropagation();
		addClass(controls, 'vjs-has-started');
		that.play();
		bigPlayButton.blur();
	}, true);

	//Load progress
	let loadProgress = getDescendantsByClassAt(progressHolder, 'vjs-load-progress', 0) as HTMLElement;
	function updateLoadProgress () {
		let bufferEnd = 0;
		for (var i = media.buffered.length - 1; i >= 0; i--) {
			if (media.buffered.start(i) <= media.currentTime) {
				bufferEnd = media.buffered.end(i);
				break;
			}
		}
		(loadProgress as HTMLElement).style.width = Math.min(Math.round(bufferEnd / media.duration * 100), 100) + '%';
	}
	addEventListener(media, 'progress', function () {
		updateLoadProgress();
		setTimeout(updateLoadProgress, 1000);
	});

	addEventListener(media, 'waiting', function () {
		onScreenConsoleOutput ('Playback entered waiting state.');
		addClass(controls, 'vjs-seeking');
		if (!that._useNative) {
			that.startBuffer();
		}
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
				that.play();
			}
		}
	});

	//Fullscreen
	const IOS_FULLSCREEN = IS_IOS && videoMedia.webkitEnterFullscreen;
	let requestFullscreen = function () {
		if (IOS_FULLSCREEN) {
			videoMedia.webkitEnterFullscreen!();
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
			exitFullscreen();
		} else {
			requestFullscreen();
		}
	};

	let fullscreenButton = getDescendantsByClassAt(controlBar, 'vjs-fullscreen-control', 0) as HTMLButtonElement;

	if (screenfull.isEnabled || IOS_FULLSCREEN) {
		removeClass(fullscreenButton, 'vjs-disabled');
		fullscreenButton.disabled = false;

		addEventListener(fullscreenButton, 'click', function (event) {
			event.stopPropagation();
			toggleFullscreen();
		}, true);

		if (!IOS_FULLSCREEN) {
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
		}
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
		if (!containsClass(controls, 'vjs-has-started')) {
			addClass(controls, 'vjs-has-started');
			that.play();
		}
	});

	addEventListener(controls, 'keydown', function (event) {
		let key = (event as KeyboardEvent).key;
		if (key === ' ' || key === 'Spacebar') {
			togglePlayback();
			event.preventDefault();
		} else if (key === 'f' || key === 'F') {
			toggleFullscreen();
			event.preventDefault();
		} else if (key === 'ArrowLeft' || key === 'Left') {
			that.seek(media.currentTime - 5);
			event.preventDefault();
		} else if (key === 'ArrowRight' || key === 'Right') {
			media.currentTime = media.currentTime + 5;
			event.preventDefault();
		} else if (key === 'ArrowUp' || key === 'Up') {
			media.currentTime = media.currentTime + 15;
			event.preventDefault();
		} else if (key === 'ArrowDown' || key === 'Down') {
			that.seek(media.currentTime - 15);
			event.preventDefault();
		}
	}, true);
}

function onScreenConsoleOutput (txt: string) {
	if (!DEBUG) {
		return;
	}

	var onScreenConsole = getById('on-screen-console');
	if (onScreenConsole instanceof HTMLTextAreaElement) {
		let date = new Date();
		let newline = (date.getHours()<10 ? '0'+date.getHours() : date.getHours()) + ':' + (date.getMinutes()<10 ? '0'+date.getMinutes() : date.getMinutes()) + ':' + (date.getSeconds()<10 ? '0'+date.getSeconds() : date.getSeconds()) + '   ' + txt + '\r\n';
		console.log(newline);
		onScreenConsole.value += newline;
	}
}