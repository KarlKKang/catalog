// JavaScript Document
import {
    secToTimestamp,
    removeRightClick,
} from '../main';
import {
    getById,
    addEventListener,
    addClass,
    removeClass,
    addEventsListener,
    d,
    w,
    remove,
    addEventListenerOnce,
    createElement,
    appendChild,
    hideElement,
    showElement,
    insertAfter
} from '../DOM';
import { IS_IOS } from '../browser';
import screenfull from 'screenfull';
import { addPlayerClass, addPlayerClasses, containsPlayerClass, removePlayerClass } from './helper';
import * as icons from './icons';

declare global {
    interface HTMLVideoElement {
        readonly webkitEnterFullscreen?: () => void;
        readonly webkitShowPlaybackTargetPicker: () => void;
        readonly webkitCurrentPlaybackTargetIsWireless?: boolean;
        autoPictureInPicture?: boolean;
    }

    interface HTMLMediaElement {
        controlsList?: DOMTokenList;
    }

    interface Window {
        WebKitPlaybackTargetAvailabilityEvent?: typeof Event;
    }

    interface Event {
        availability?: string;
    }
}

export class Player {
    private readonly DEBUG: boolean;
    protected readonly IS_VIDEO: boolean;

    protected _media: HTMLVideoElement | HTMLAudioElement;
    public get media() { return this._media; }

    public readonly controls: HTMLElement;
    public readonly bigPlayButton: HTMLButtonElement;
    private readonly controlBar: HTMLElement;
    private readonly playButton: HTMLElement;
    private readonly currentTimeDisplay: HTMLElement;
    private readonly currentTimeDisplayText: HTMLElement;
    private readonly progressControl: HTMLElement;
    private readonly progressHolder: HTMLElement;
    private readonly loadProgress: HTMLElement;
    private readonly progressBar: HTMLElement;
    private readonly progressMouseDisplay: HTMLElement;
    private readonly timeTooltip: HTMLElement;
    private readonly durationDisplay: HTMLElement;
    private readonly durationDisplayText: HTMLElement;
    private readonly timeDivider: HTMLElement;
    private readonly PIPButton: HTMLButtonElement | undefined;
    private readonly fullscreenButton: HTMLButtonElement;
    private readonly airPlayButton: HTMLButtonElement;

    protected attached = false;

    protected playing = false;
    protected dragging = false;

    protected timer: NodeJS.Timer | undefined;
    private inactiveTimeout = 12; // 3000 / 250
    private draggingPreviewTimeout = 4; // 1000 / 250
    private droppedFrames = 0;
    private corruptedFrames = 0;

    private playPromise: Promise<void> | undefined;
    protected onPlayPromiseError: (() => void) | undefined;

    public get paused(): boolean {
        return !this.playing && this.media.paused;
    }

    constructor(
        container: HTMLDivElement,
        config?: {
            audio?: boolean;
            debug?: boolean;
        }
    ) {
        config = config ?? {};
        this.IS_VIDEO = !(config.audio === true);
        this.DEBUG = config.debug === true;

        // Container
        const controls = container;
        this.controls = controls;
        addClass(controls, 'player');
        controls.lang = 'en';
        controls.tabIndex = -1;
        controls.translate = false;
        addPlayerClasses(controls, ['big-play-centered', 'fluid', 'controls-enabled', 'paused', 'user-active']);
        this.IS_VIDEO || addPlayerClass(controls, 'audio');
        removeRightClick(controls);

        // Media
        const media = createElement(this.IS_VIDEO ? 'video' : 'audio') as HTMLVideoElement | HTMLAudioElement;
        this._media = media;
        media.tabIndex = -1;
        addPlayerClass(media, 'tech');
        appendChild(controls, media);

        // Loading spinner
        const loadingSpinner = createElement('div');
        addPlayerClass(loadingSpinner, 'loading-spinner');
        loadingSpinner.dir = 'ltr';
        this.IS_VIDEO && appendChild(controls, loadingSpinner);

        // Big play button
        const bigPlayButton = createElement('button') as HTMLButtonElement;
        this.bigPlayButton = bigPlayButton;
        bigPlayButton.type = 'button';
        bigPlayButton.title = 'Play Video';
        addPlayerClass(bigPlayButton, 'big-play-button');
        const bigPlayButtonPlaceholder = addPlayerPlaceholder(bigPlayButton);
        this.IS_VIDEO && appendChild(controls, bigPlayButton);

        // Control bar
        const controlBar = createElement('div');
        this.controlBar = controlBar;
        controlBar.dir = 'ltr';
        addPlayerClass(controlBar, 'control-bar');
        appendChild(controls, controlBar);

        // Play button
        const playButton = createElement('button') as HTMLButtonElement;
        this.playButton = playButton;
        playButton.type = 'button';
        playButton.title = 'Play';
        addPlayerClasses(playButton, ['play-control', 'control', 'button', 'paused']);
        const playButtonIconPlaceholder = addPlayerPlaceholder(playButton);
        appendChild(controlBar, playButton);

        // Current time display
        const currentTimeDisplay = createElement('div');
        this.currentTimeDisplay = currentTimeDisplay;
        addPlayerClasses(currentTimeDisplay, ['current-time', 'time-control', 'control']);
        appendChild(controlBar, currentTimeDisplay);

        const currentTimeDisplayText = createElement('span');
        this.currentTimeDisplayText = currentTimeDisplayText;
        currentTimeDisplayText.textContent = '0:00';
        addPlayerClass(currentTimeDisplayText, 'current-time-display');
        appendChild(currentTimeDisplay, currentTimeDisplayText);

        // Time divider
        const timeDivier = createElement('div');
        this.timeDivider = timeDivier;
        addPlayerClasses(timeDivier, ['time-control', 'time-divider']);
        appendChild(controlBar, timeDivier);

        const timeDividerText = createElement('span');
        timeDividerText.textContent = '/';
        appendChild(timeDivier, timeDividerText);

        // Duration display
        const durationDisplay = createElement('div');
        this.durationDisplay = durationDisplay;
        addPlayerClasses(durationDisplay, ['duration', 'time-control', 'control']);
        appendChild(controlBar, durationDisplay);

        const durationDisplayText = createElement('div');
        this.durationDisplayText = durationDisplayText;
        durationDisplayText.textContent = '0:00';
        addPlayerClass(durationDisplayText, 'duration-display');
        appendChild(durationDisplay, durationDisplayText);

        if (w.innerWidth < 320) {
            hideElement(currentTimeDisplay);
            hideElement(timeDivier);
            hideElement(durationDisplay);
        }

        // Progress control
        const progressControl = createElement('div');
        this.progressControl = progressControl;
        addPlayerClasses(progressControl, ['progress-control', 'control']);
        appendChild(controlBar, progressControl);

        const progressHolder = createElement('div');
        this.progressHolder = progressHolder;
        progressHolder.tabIndex = 0;
        addPlayerClasses(progressHolder, ['progress-holder', 'slider', 'slider-horizontal']);
        appendChild(progressControl, progressHolder);

        // Load progress
        const loadProgress = createElement('div');
        this.loadProgress = loadProgress;
        addPlayerClass(loadProgress, 'load-progress');
        loadProgress.style.width = '0%';
        this.IS_VIDEO && appendChild(progressHolder, loadProgress);

        // Mouse display
        const mouseDisplay = createElement('div');
        this.progressMouseDisplay = mouseDisplay;
        addPlayerClass(mouseDisplay, 'mouse-display');
        appendChild(progressHolder, mouseDisplay);

        // Time tooltip
        const timeTooltip = createElement('div');
        this.timeTooltip = timeTooltip;
        timeTooltip.textContent = '0:00';
        addPlayerClass(timeTooltip, 'time-tooltip');
        appendChild(mouseDisplay, timeTooltip);

        // Play progress
        const playProgress = createElement('div');
        this.progressBar = playProgress;
        addPlayerClasses(playProgress, ['play-progress', 'slider-bar']);
        playProgress.style.width = '0%';
        appendChild(progressHolder, playProgress);

        // PIP
        let PIPButtonPlaceholder: undefined | HTMLElement = undefined;
        if (d.pictureInPictureEnabled) {
            const PIPButton = createElement('button') as HTMLButtonElement;
            this.PIPButton = PIPButton;
            PIPButton.type = 'button';
            PIPButton.title = 'Picture-in-Picture';
            addPlayerClasses(PIPButton, ['picture-in-picture-control', 'control', 'button']);
            PIPButtonPlaceholder = addPlayerPlaceholder(PIPButton);
            this.IS_VIDEO && appendChild(controlBar, PIPButton);
        }

        // Fullscreen
        const fullscreenButton = createElement('button') as HTMLButtonElement;
        this.fullscreenButton = fullscreenButton;
        fullscreenButton.type = 'button';
        fullscreenButton.title = 'Fullscreen';
        addPlayerClasses(fullscreenButton, ['fullscreen-control', 'control', 'button']);
        const fullscreenButtonPlaceholder = addPlayerPlaceholder(fullscreenButton);
        this.IS_VIDEO && appendChild(controlBar, fullscreenButton);

        // AirPlay
        const airPlayButton = createElement('button') as HTMLButtonElement;
        this.airPlayButton = airPlayButton;
        airPlayButton.type = 'button';
        airPlayButton.title = 'AirPlay';
        addPlayerClasses(airPlayButton, ['airplay-control', 'control', 'button']);
        const airPlayButtonPlaceholder = addPlayerPlaceholder(airPlayButton);

        appendChild(bigPlayButtonPlaceholder, icons.getPlayIcon());
        appendChild(playButtonIconPlaceholder, icons.getPlayIcon());
        appendChild(playButtonIconPlaceholder, icons.getPauseIcon());
        appendChild(playButtonIconPlaceholder, icons.getReplayIcon());
        appendChild(playProgress, icons.getCircle());
        if (PIPButtonPlaceholder !== undefined) {
            appendChild(PIPButtonPlaceholder, icons.getPIPEnterIcon());
            appendChild(PIPButtonPlaceholder, icons.getPIPExitIcon());
        }
        appendChild(fullscreenButtonPlaceholder, icons.getFullscreenEnterIcon());
        appendChild(fullscreenButtonPlaceholder, icons.getFullscreenExitIcon());
        appendChild(airPlayButtonPlaceholder, icons.getAirPlayIcon());
    }

    protected preattach(this: Player) {
        this.attached = true;
        this.attachEventListeners();
        if (this.IS_VIDEO) {
            this.attachVideoEventListeners();
        }
        this.setMediaAttributes();
    }

    protected attach(this: Player, onload?: (...args: any[]) => void, onerror?: (...args: any[]) => void): void {
        this.preattach();

        this.media.crossOrigin = 'use-credentials';
        addEventListener(this.media, 'error', function (this: any, event) {
            onerror && onerror.call(this, event);
        });
        addEventListener(this.media, 'loadedmetadata', function (this: any, event) {
            onload && onload.call(this, event);
        });
        this.media.volume = 1;
        this.onScreenConsoleOutput('Native HLS is attached.');
    }

    public load(
        this: Player,
        url: string,
        config?: {
            play?: boolean | undefined;
            startTime?: number | undefined;
            onload?: (...args: any[]) => void;
            onerror?: (...args: any[]) => void;
            onplaypromiseerror?: () => void;
        }
    ): void {
        config = config ?? {};

        if (!this.attached) {
            this.attach(config.onload, config.onerror);
            this.onPlayPromiseError = config.onplaypromiseerror;
        }

        const play = config.play === true;
        const startTime = config.startTime;

        const callback = function (this: Player) {
            if (play) {
                this.media.play().catch(() => {
                    if (startTime !== undefined) {
                        this.seek(startTime); // If the play promise is rejected, currentTime will be reset to 0 on older versions of Safari.
                    }
                });
            }
            if (startTime !== undefined) {
                this.seek(startTime); // Calling the play method will reset the currentTime to 0 on older versions of Safari. So it should be set after calling the play().
            }
        }.bind(this);

        this.pause();
        addEventListenerOnce(this.media, 'loadedmetadata', callback);
        this.media.src = url;
        this.media.load();
        this.onScreenConsoleOutput('Native HLS source loaded.');
    }

    public destroy(this: Player) {
        this.timer && clearInterval(this.timer);
        this.pause();
        this.media.removeAttribute('src');
        this.media.load();
        remove(this.controls);
    }

    public play(this: Player) {
        this.playPromise = this.media.play();
        this.playPromise.catch((e) => {
            this.onPlayPromiseError && this.onPlayPromiseError();
            this.onScreenConsoleOutput('play promise rejected');
            throw e;
        });
    }

    public pause(this: Player) {
        const playPromise = this.playPromise;
        if (this.playPromise === undefined) {
            this.media.pause();
        } else {
            this.playPromise.then(() => {
                if (this.playPromise === playPromise) {
                    this.media.pause();
                }
            });
        }
    }

    public seek(this: Player, timestamp: number) {
        this.media.currentTime = timestamp;
    }

    private setMediaAttributes(this: Player) {
        if (typeof this.media.preload !== 'undefined') {
            this.media.preload = 'auto';
        }
        if (typeof this.media.controlsList !== 'undefined') {
            if (this.media.controlsList.supports('nodownload')) {
                this.media.controlsList.add('nodownload');
            }
            if (this.media.controlsList.supports('noplaybackrate')) {
                this.media.controlsList.add('noplaybackrate');
            }
        }

        if (this.media instanceof HTMLVideoElement) {
            if (typeof this.media.playsInline !== 'undefined') {
                this.media.playsInline = true;
            }
            if (typeof this.media.autoPictureInPicture !== 'undefined') {
                this.media.autoPictureInPicture = true;
            }
        }
    }

    protected togglePlayback(this: Player) {
        if (containsPlayerClass(this.controls, 'playing')) {
            this.pause();
        } else {
            this.play();
        }
    }

    private resetToActive(this: Player) {
        this.inactiveTimeout = 12;
        removePlayerClass(this.controls, 'user-inactive');
        addPlayerClass(this.controls, 'user-active');
    }

    private attachEventListeners(this: Player) {
        //Fluid resize and duration
        addEventListener(w, 'resize', function (this: Player) {
            let func = showElement;
            if (w.innerWidth < 320) {
                func = hideElement;
            }
            func(this.currentTimeDisplay);
            func(this.timeDivider);
            func(this.durationDisplay);
        }.bind(this));

        addEventListener(this.media, 'loadedmetadata', this.onloadedmetadata.bind(this));

        addEventListener(this.media, 'durationchange', function (this: Player) {
            const duration = this.media.duration;
            this.durationDisplayText.textContent = secToTimestamp(duration);
            this.currentTimeDisplayText.textContent = secToTimestamp(this.media.currentTime, duration);
        }.bind(this));

        //Play button
        addEventListener(this.playButton, 'click', function (this: Player) {
            if (containsPlayerClass(this.controls, 'ended')) {
                removePlayerClass(this.controls, 'ended');
                removePlayerClass(this.playButton, 'ended');
                this.seek(0);
                this.play();
            } else {
                this.togglePlayback();
            }
            this.playButton.blur();
        }.bind(this));

        //Progress bar & frame drop monitor
        this.timer = setInterval(this.intervalCallback.bind(this), 250);

        //Progress bar
        addEventsListener(this.progressControl, ['mousedown', 'touchstart'], function (this: Player, event: Event) {
            this.dragging = true;
            this.draggingPreviewTimeout = 4;
            if (!this.media.paused) {
                this.pause();
                this.playing = true;
            }

            removePlayerClass(this.controls, 'ended');
            removePlayerClass(this.playButton, 'ended');

            this.progressUpdate(event as MouseEvent | TouchEvent);
        }.bind(this));

        addEventsListener(d, ['mouseup', 'touchend', 'touchcancel'], function (this: Player, event: Event) {
            if (this.dragging) {
                this.ondragended(event as MouseEvent | TouchEvent);
            }
        }.bind(this));

        addEventsListener(this.progressControl, ['mousemove', 'touchmove'], function (this: Player, event: Event) {
            this.progressUpdate(event as MouseEvent | TouchEvent);
        }.bind(this));

        //Activity on media
        addEventListener(this.media, 'play', function (this: Player) {
            this.onScreenConsoleOutput('Playback started at ' + this.media.currentTime + '.');
            this.onplay();
        }.bind(this));

        addEventListener(this.media, 'pause', function (this: Player) {
            if (this.media.currentTime >= this.media.duration - 0.1) {
                this.onended();
            } else if (!this.dragging) {
                this.onpause();
            }
        }.bind(this));

        addEventListener(this.media, 'ended', this.onended.bind(this));

        //Redundent
        addEventListener(this.media, 'seeking', function (this: Player) {
            this.onScreenConsoleOutput('Seeking: ' + this.media.currentTime);
        }.bind(this));
        addEventListener(this.media, 'seeked', function (this: Player) {
            this.onScreenConsoleOutput('Seeked: ' + this.media.currentTime);
        }.bind(this));
    }

    private attachVideoEventListeners(this: Player) {
        //Catch events on control bar, otherwise bubbling events on the parent (constrols) will be fired.
        addEventListener(this.controlBar, 'click', function (event: Event) {
            event.stopPropagation();
        });

        //UI activity
        addEventsListener(this.controls, ['mousemove', 'touchmove', 'click'], this.resetToActive.bind(this), true);
        let touchClick = false;
        addEventListener(this.controls, 'touchend', function (this: Player) {
            touchClick = true;
            setTimeout(function () { touchClick = false; }, 300);
            this.resetToActive();
        }.bind(this), true);
        addEventListener(this.controls, 'click', function (this: Player) {
            if (!touchClick) {
                this.togglePlayback();
            }
        }.bind(this));

        //Big play button
        addEventListener(this.bigPlayButton, 'click', function (this: Player, event: Event) {
            event.stopPropagation();
            this.play();
            this.bigPlayButton.blur();
        }.bind(this));

        //Load progress
        const updateLoadProgress = () => {
            let bufferEnd = 0;
            const bufferedRange = this.getBufferedRange();
            for (const buffer of bufferedRange) {
                if (buffer.start > this.media.currentTime) {
                    break;
                }
                bufferEnd = buffer.end;
            }
            this.loadProgress.style.width = Math.min(Math.round(bufferEnd / this.media.duration * 100), 100) + '%';
        };
        addEventListener(this.media, 'progress', function () {
            updateLoadProgress();
            setTimeout(updateLoadProgress, 1000);
        });

        addEventListener(this.media, 'waiting', function (this: Player) {
            if (this.media.currentTime >= this.media.duration - 0.1) {
                this.onScreenConsoleOutput('Playback entered waiting state before ended at ' + this.media.currentTime + '.');
                this.pause();
            } else {
                this.onwaiting();
            }
        }.bind(this));

        //Loading
        addEventListener(this.media, 'canplaythrough', this.oncanplaythrough.bind(this));

        //Fullscreen
        const webkitEnterFullscreen = (this.media as HTMLVideoElement).webkitEnterFullscreen;
        const IOS_FULLSCREEN = IS_IOS && webkitEnterFullscreen !== undefined;
        const requestFullscreen = function (this: Player) {
            if (IOS_FULLSCREEN) {
                webkitEnterFullscreen.apply(this.media);
            } else {
                screenfull.request(this.controls);
            }

            this.controls.focus();
        }.bind(this);

        const exitFullscreen = function (this: Player) {
            screenfull.exit();
            this.controls.focus();
        }.bind(this);

        const toggleFullscreen = function (this: Player) {
            if (containsPlayerClass(this.controls, 'fullscreen')) {
                exitFullscreen();
            } else {
                requestFullscreen();
            }
        }.bind(this);

        if (screenfull.isEnabled || IOS_FULLSCREEN) {
            removePlayerClass(this.fullscreenButton, 'disabled');

            addEventListener(this.fullscreenButton, 'click', function () {
                toggleFullscreen();
            });

            if (!IOS_FULLSCREEN) {
                screenfull.on('change', function (this: Player) {
                    const elemInFS = screenfull.element;
                    if (elemInFS === undefined) {
                        removePlayerClass(this.controls, 'fullscreen');
                        this.fullscreenButton.title = 'Fullscreen';
                    } else if (elemInFS.isSameNode(this.controls) || elemInFS.isSameNode(this.media)) {
                        addPlayerClass(this.controls, 'fullscreen');
                        this.fullscreenButton.title = 'Exit Fullscreen';
                    }
                }.bind(this));
            }
        } else {
            addPlayerClass(this.fullscreenButton, 'disabled');
            this.fullscreenButton.title = 'Fullscreen Unavailable';
        }

        //Picture in picture
        const PIPButton = this.PIPButton;
        if (PIPButton !== undefined) {
            addEventListener(PIPButton, 'click', function (this: Player) {
                if (containsPlayerClass(this.controls, 'picture-in-picture')) {
                    d.exitPictureInPicture();
                } else {
                    (this.media as HTMLVideoElement).requestPictureInPicture();
                }
                PIPButton.blur();
            }.bind(this));

            addEventListener(this.media, 'enterpictureinpicture', function (this: Player) {
                addPlayerClass(this.controls, 'picture-in-picture');
                PIPButton.title = 'Exit Picture-in-Picture';
            }.bind(this));

            addEventListener(this.media, 'leavepictureinpicture', function (this: Player) {
                removePlayerClass(this.controls, 'picture-in-picture');
                PIPButton.title = 'Picture-in-Picture';
            }.bind(this));
        }

        //AirPlay
        if (w.WebKitPlaybackTargetAvailabilityEvent) {
            this.onScreenConsoleOutput('Airplay available');
            addEventListener(this.media, 'webkitplaybacktargetavailabilitychanged', (event) => {
                this.onScreenConsoleOutput('webkitplaybacktargetavailabilitychanged: ' + event.availability);
                if (event.availability !== 'available') {
                    return;
                }
                insertAfter(this.airPlayButton, this.progressControl);
                addEventListener(this.airPlayButton, 'click', () => {
                    (this.media as HTMLVideoElement).webkitShowPlaybackTargetPicker();
                });
                addEventListener(this.media, 'webkitcurrentplaybacktargetiswirelesschanged', () => {
                    if ((this.media as HTMLVideoElement).webkitCurrentPlaybackTargetIsWireless) {
                        addPlayerClass(this.controls, 'airplay');
                    } else {
                        removePlayerClass(this.controls, 'airplay');
                    }
                });
            });
        }

        //Hotkeys
        addEventListener(this.controls, 'keydown', function (this: Player, event: Event) {
            const key = (event as KeyboardEvent).key;
            if (key === ' ' || key === 'Spacebar') {
                this.togglePlayback();
                this.resetToActive(); // 'keydown' is not a trigger for 'resetToActive'
                event.preventDefault();
            } else if (key === 'f' || key === 'F') {
                toggleFullscreen();
                event.preventDefault();
            } else if (key === 'ArrowLeft' || key === 'Left') {
                this.seek(this.media.currentTime - 5);
                event.preventDefault();
            } else if (key === 'ArrowRight' || key === 'Right') {
                this.media.currentTime = this.media.currentTime + 5;
                event.preventDefault();
            } else if (key === 'ArrowUp' || key === 'Up') {
                this.media.currentTime = this.media.currentTime + 15;
                event.preventDefault();
            } else if (key === 'ArrowDown' || key === 'Down') {
                this.seek(this.media.currentTime - 15);
                event.preventDefault();
            }
        }.bind(this));
    }

    private intervalCallback(this: Player): void {
        const duration = this.media.duration;
        if (!duration) {
            return;
        }
        if (this.dragging) {
            if (this.draggingPreviewTimeout > 0 && this.IS_VIDEO) {
                this.draggingPreviewTimeout--;
            }
            return;
        }

        const currentTimestamp = secToTimestamp(this.media.currentTime, duration);
        if (this.currentTimeDisplayText.textContent !== currentTimestamp) { // Setting innerHTML will force refresh even if the value is not changed.
            this.currentTimeDisplayText.textContent = currentTimestamp;
        }
        this.progressBar.style.width = Math.min(this.media.currentTime / duration * 100, 100) + '%';

        if (!this.IS_VIDEO) {
            return;
        }

        if (this.inactiveTimeout > 0) {
            this.inactiveTimeout--;
            if (this.inactiveTimeout == 0) {
                removePlayerClass(this.controls, 'user-active');
                addPlayerClass(this.controls, 'user-inactive');
            }
        }

        if (this.DEBUG) {
            if (typeof (this.media as HTMLVideoElement).getVideoPlaybackQuality === 'function') {
                const quality = (this.media as HTMLVideoElement).getVideoPlaybackQuality();
                if (quality.droppedVideoFrames && quality.droppedVideoFrames != this.droppedFrames) {
                    this.onScreenConsoleOutput('Frame drop detected. Total dropped: ' + quality.droppedVideoFrames);
                    this.droppedFrames = quality.droppedVideoFrames;
                }
                if (quality.corruptedVideoFrames && quality.corruptedVideoFrames != this.corruptedFrames) {
                    this.onScreenConsoleOutput('Frame corruption detected. Total corrupted: ' + quality.corruptedVideoFrames);
                    this.corruptedFrames = quality.corruptedVideoFrames;
                }
            }
        }
    }

    protected onloadedmetadata(this: Player): void {
        if (this.IS_VIDEO) {
            const videoMedia = this.media as HTMLVideoElement;
            this.controls.style.paddingTop = (videoMedia.videoHeight / videoMedia.videoWidth * 100) + '%';
        }
        this.durationDisplayText.textContent = secToTimestamp(this.media.duration);
        if (containsPlayerClass(this.controls, 'ended')) {
            removePlayerClass(this.controls, 'ended');
            removePlayerClass(this.playButton, 'ended');
        }
    }

    protected ondragended(this: Player, event: MouseEvent | TouchEvent): void {
        this.dragging = false;

        const currentTime = this.progressUpdate(event);
        this.seek(currentTime);

        if (this.playing) {
            this.play();
            this.playing = false;
        }
        this.progressControl.blur();
    }

    private progressUpdate(this: Player, event: MouseEvent | TouchEvent): number {
        let mouseX;
        if (w.TouchEvent !== undefined && event instanceof TouchEvent) {
            const touchEvent = event as TouchEvent;
            const touch = touchEvent.touches[0] || touchEvent.changedTouches[0];
            if (touch === undefined) {
                throw new Error('Failed to get TouchEvent data.');
            }
            mouseX = touch.clientX;
        } else {
            mouseX = (event as MouseEvent).clientX;
        }
        const position = this.progressHolder.getBoundingClientRect();
        const totalLength = position.right - position.left;
        const leftPadding = Math.min(Math.max(mouseX - position.left, 0), totalLength);
        const percentage = leftPadding / totalLength;
        const duration = this.media.duration;
        const currentTime = duration * percentage;
        const currentTimestamp = secToTimestamp(currentTime, duration);

        if (window.matchMedia('only screen and (hover: none), only screen and(pointer: none), only screen and(pointer: coarse)')) {
            this.progressMouseDisplay.style.left = leftPadding + 'px';
            this.timeTooltip.textContent = currentTimestamp;
            this.timeTooltip.style.right = -this.timeTooltip.offsetWidth / 2 + 'px';
            if (currentTime > this.media.currentTime) {
                removeClass(this.progressMouseDisplay, 'backward');
                addClass(this.progressMouseDisplay, 'forward');
            } else {
                removeClass(this.progressMouseDisplay, 'forward');
                addClass(this.progressMouseDisplay, 'backward');
            }
        }
        if (this.dragging) {
            if (this.draggingPreviewTimeout === 0) {
                this.seek(currentTime);
                this.draggingPreviewTimeout = 4;
            }
            this.currentTimeDisplayText.textContent = currentTimestamp;
            this.progressBar.style.width = percentage * 100 + '%';
        }
        event.preventDefault(); // If touch events are not stopped then subsequent mouse event will be fired.
        return currentTime;
    }

    protected onplay(this: Player): void {
        addPlayerClass(this.controls, 'has-started');
        removePlayerClass(this.playButton, 'paused');
        addPlayerClass(this.playButton, 'playing');
        removePlayerClass(this.controls, 'paused');
        addPlayerClass(this.controls, 'playing');
        if (containsPlayerClass(this.controls, 'ended')) {
            removePlayerClass(this.controls, 'ended');
            removePlayerClass(this.playButton, 'ended');
        }
    }

    protected onpause(this: Player): void {
        this.onScreenConsoleOutput('Playback paused at ' + this.media.currentTime + '.');
        removePlayerClass(this.playButton, 'playing');
        addPlayerClass(this.playButton, 'paused');
        removePlayerClass(this.controls, 'playing');
        addPlayerClass(this.controls, 'paused');
    }

    protected onended(this: Player): void {
        this.onScreenConsoleOutput('Playback ended.');
        removePlayerClass(this.playButton, 'playing');
        addPlayerClass(this.playButton, 'paused');
        removePlayerClass(this.controls, 'playing');
        addPlayerClass(this.controls, 'paused');
        addPlayerClass(this.controls, 'ended');
        addPlayerClass(this.playButton, 'ended');
    }

    protected onwaiting(this: Player): void {
        this.onScreenConsoleOutput('Playback entered waiting state at ' + this.media.currentTime + '.');
        addPlayerClass(this.controls, 'seeking');
    }

    protected oncanplaythrough(this: Player): void {
        this.onScreenConsoleOutput('Playback can play through at ' + this.media.currentTime + '.');
        removePlayerClass(this.controls, 'seeking');
    }

    protected getBufferedRange(this: Player): { start: number; end: number }[] {
        const bufferedRange = [];
        let currentBuffer: null | { start: number; end: number } = null;
        for (let i = 0; i < this.media.buffered.length; i++) {
            const nextBufferStart = this.media.buffered.start(i);
            if (currentBuffer === null) {
                currentBuffer = { start: nextBufferStart, end: this.media.buffered.end(i) };
            } else {
                if (nextBufferStart - 0.5 <= currentBuffer.end) { // This value should match `maxBufferHole` in hls.js config.
                    this.onScreenConsoleOutput('Buffer hole detected: ' + currentBuffer.end + '-' + nextBufferStart + '. Duration: ' + (nextBufferStart - currentBuffer.end));
                    currentBuffer.end = this.media.buffered.end(i);
                } else {
                    bufferedRange.push(currentBuffer);
                    currentBuffer = { start: nextBufferStart, end: this.media.buffered.end(i) };
                }
            }
        }
        currentBuffer && bufferedRange.push(currentBuffer);
        return bufferedRange;
    }

    protected onScreenConsoleOutput(this: Player, txt: string) {
        if (!this.DEBUG) {
            return;
        }

        const onScreenConsole = getById('on-screen-console');
        if (onScreenConsole instanceof HTMLTextAreaElement) {
            const date = new Date();
            const newline = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()) + '   ' + txt + '\r\n';
            console.log(newline);
            onScreenConsole.value += newline;
        }
    }
}

function addPlayerPlaceholder(elem: HTMLElement) {
    const placeholder = createElement('span');
    // placeholder.ariaHidden = 'true';
    addPlayerClass(placeholder, 'icon-placeholder');
    appendChild(elem, placeholder);
    return placeholder;
}