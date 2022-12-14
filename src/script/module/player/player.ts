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
    showElement
} from '../DOM';
import { IS_IOS } from '../browser';
import screenfull from 'screenfull';
import { addPlayerClass, addPlayerClasses, containsPlayerClass, removePlayerClass } from './helper';

declare global {
    interface HTMLVideoElement {
        readonly webkitEnterFullscreen?: () => void,
        autoPictureInPicture?: boolean,
    }

    interface HTMLMediaElement {
        controlsList?: DOMTokenList
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

    protected attached = false;

    protected playing = false;
    protected dragging = false;

    protected timer: NodeJS.Timer | undefined;
    private inactiveTimeout = 12; // 3000 / 250
    private draggingPreviewTimeout = 4; // 1000 / 250
    private droppedFrames = 0;
    private corruptedFrames = 0;

    public get paused(): boolean {
        return !this.playing && this.media.paused;
    }

    constructor(
        container: HTMLDivElement,
        config?: {
            audio?: boolean,
            debug?: boolean
        }
    ) {
        config = config ?? {};
        this.IS_VIDEO = !(config.audio === true);

        const icons = getIcons();

        // Container
        const controls = container;
        this.controls = controls;
        addClass(controls, 'player');
        controls.lang = 'en';
        controls.tabIndex = -1;
        controls.translate = false;
        addPlayerClasses(controls, ['big-play-centered', 'fluid', 'controls-enabled', 'paused', 'user-active']);
        this.IS_VIDEO || addPlayerClass(controls, 'audio');

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
        appendChild(bigPlayButtonPlaceholder, icons.play.cloneNode(true));
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
        appendChild(playButtonIconPlaceholder, icons.play);
        appendChild(playButtonIconPlaceholder, icons.pause);
        appendChild(playButtonIconPlaceholder, icons.replay);
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
        appendChild(playProgress, icons.circle);
        appendChild(progressHolder, playProgress);

        // PIP
        if (d.pictureInPictureEnabled) {
            const PIPButton = createElement('button') as HTMLButtonElement;
            this.PIPButton = PIPButton;
            PIPButton.type = 'button';
            PIPButton.title = 'Picture-in-Picture';
            addPlayerClasses(PIPButton, ['picture-in-picture-control', 'control', 'button']);
            const PIPButtonPlaceholder = addPlayerPlaceholder(PIPButton);
            appendChild(PIPButtonPlaceholder, icons.PIPEnter);
            appendChild(PIPButtonPlaceholder, icons.PIPExit);
            this.IS_VIDEO && appendChild(controlBar, PIPButton);
        }

        // Fullscreen
        const fullscreenButton = createElement('button') as HTMLButtonElement;
        this.fullscreenButton = fullscreenButton;
        fullscreenButton.type = 'button';
        fullscreenButton.title = 'Fullscreen';
        addPlayerClasses(fullscreenButton, ['fullscreen-control', 'control', 'button']);
        const fullscreenButtonPlaceholder = addPlayerPlaceholder(fullscreenButton);
        appendChild(fullscreenButtonPlaceholder, icons.fullscreenEnter);
        appendChild(fullscreenButtonPlaceholder, icons.fullscreenExit);
        this.IS_VIDEO && appendChild(controlBar, fullscreenButton);

        this.DEBUG = config.debug === true;
        removeRightClick(controls);
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
            play?: boolean | undefined,
            startTime?: number | undefined,
            onload?: (...args: any[]) => void,
            onerror?: (...args: any[]) => void
        }
    ): void {
        config = config ?? {};

        if (!this.attached) {
            this.attach(config.onload, config.onerror);
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
        this.media.play();
    }

    public pause(this: Player) {
        this.media.pause();
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

    private togglePlayback(this: Player) {
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
                func = hideElement
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
                this.media.pause();
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
        addEventListener(this.media, 'play', this.onplay.bind(this));

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
            this.fullscreenButton.disabled = false;

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
            this.fullscreenButton.disabled = true;
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
            if (this.draggingPreviewTimeout > 0) {
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
        this.onScreenConsoleOutput('Playback started at ' + this.media.currentTime + '.');
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

    protected getBufferedRange(this: Player): { start: number, end: number }[] {
        const bufferedRange = [];
        let currentBuffer: null | { start: number, end: number } = null;
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

function createSvg(viewBox: string, path: string) {
    const svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBox);
    addSvgPath(svg, path);
    return svg;
}

function addSvgPath(svg: SVGSVGElement, path: string) {
    const svgPath = d.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
    );
    svgPath.setAttribute('d', path);
    appendChild(svg, svgPath);
}

function getIcons() {
    const viewBox = '0 0 1802 1792';

    const playIcon = createSvg(viewBox, 'm599.05,1419V373s905.86,523,905.86,523l-905.86,523Z');
    addClass(playIcon, 'player-play-icon');

    const pauseIcon = createSvg(viewBox, 'm453,1419h299V373h-299v1046ZM1050,373v1046h299V373h-299Z');
    addClass(pauseIcon, 'player-pause-icon');

    const replayIcon = createSvg(viewBox, 'm901,503.09V242.03l-326.77,326.77,326.77,326.77v-261.06c71.25,0,137.25,17.81,197.99,53.44,59.57,34.46,106.59,81.47,141.04,141.04,35.63,60.74,53.44,126.59,53.44,197.55s-17.81,137.1-53.44,198.42c-34.46,58.99-81.47,106-141.04,141.04-60.74,35.63-126.73,53.44-197.99,53.44s-137.25-17.81-197.99-53.44c-59.57-35.04-106.59-82.06-141.04-141.04-35.63-61.32-53.44-127.32-53.44-197.99h-130.53c0,70.67,13.72,138.42,41.17,203.24,26.28,62.49,63.51,117.97,111.7,166.45,48.18,48.47,103.52,85.85,166.01,112.13,64.83,27.45,132.87,41.17,204.12,41.17s139.29-13.72,204.12-41.17c62.49-26.28,117.83-63.66,166.01-112.13,48.18-48.47,85.41-103.96,111.7-166.45,27.45-64.83,41.17-132.72,41.17-203.68s-13.72-138.85-41.17-203.68c-26.28-62.49-63.51-117.83-111.7-166.01-48.18-48.18-103.52-85.71-166.01-112.57-64.83-27.45-132.87-41.17-204.12-41.17Z')
    addClass(replayIcon, 'player-replay-icon');

    const circle = createSvg(viewBox, 'm1424,896c0,288.84-234.16,523-523,523s-523-234.16-523-523,234.16-523,523-523,523,234.16,523,523Z');
    addClass(circle, 'player-circle-icon');

    const fullscreenEnterIcon = createSvg(viewBox, 'm528,1045h-150v374h374v-150h-224v-224Zm-150-298h150v-224h224v-150h-374v374Zm896,522h-224v150h374v-374h-150v224Zm-224-896v150h224v224h150v-374h-374Z');
    addClass(fullscreenEnterIcon, 'player-fullscreen-enter-icon');

    const fullscreenExitIcon = createSvg(viewBox, 'm378,1195h224v224h150v-374h-374v150Zm224-598h-224v150h374v-374h-150v224Zm448,822h150v-224h224v-150h-374v374Zm150-822v-224h-150v374h374v-150h-224Z');
    addClass(fullscreenExitIcon, 'player-fullscreen-exit-icon');

    const PIPEnterIcon = createSvg(viewBox, 'm1308.04,837.63h-465.41v348.67h465.41v-348.67Zm231.93,465.41V488.18c0-21.27-5.19-40.6-15.57-57.98-10.38-17.38-24.52-31.26-42.42-41.64-17.9-10.38-37.23-15.57-57.98-15.57H378c-20.75,0-40.08,5.19-57.98,15.57-17.9,10.38-32.04,24.26-42.42,41.64s-15.57,36.71-15.57,57.98v814.85c0,20.75,5.19,40.08,15.57,57.98s24.52,32.04,42.42,42.42,37.23,15.57,57.98,15.57h1046c20.75,0,40.08-5.19,57.98-15.57,17.9-10.38,32.04-24.52,42.42-42.42,10.38-17.9,15.57-37.23,15.57-57.98Zm-115.96.78H378V487.41h1046v816.41Z');
    addClass(PIPEnterIcon, 'player-picture-in-picture-enter-icon');

    const PIPExitIcon = createSvg(viewBox, 'm1307.72,605.31H494.28v581.37h813.44v-581.37Zm232.24,697.53V487.99c0-21.01-5.15-40.28-15.46-57.79-10.31-17.51-24.41-31.42-42.31-41.73-17.89-10.31-37.35-15.47-58.35-15.47H378.16c-21.01,0-40.36,5.16-58.06,15.47-17.7,10.31-31.8,24.22-42.31,41.73-10.5,17.51-15.76,36.77-15.76,57.79v814.85c0,21.01,5.25,40.37,15.76,58.08,10.5,17.71,24.61,31.81,42.31,42.32,17.7,10.51,37.05,15.76,58.06,15.76h1045.68c21.01,0,40.36-5.25,58.06-15.76,17.7-10.51,31.8-24.61,42.31-42.32,10.5-17.71,15.76-37.07,15.76-58.08Zm-116.12,1.17H378.16V487.41h1045.68v816.6Z');
    addClass(PIPExitIcon, 'player-picture-in-picture-exit-icon');

    const airplayIcon = createSvg(viewBox, 'm1540.14,488.22v639.4c0,63.63-51.58,115.22-115.22,115.22h-189.2l-99.67-114.44h288.09V487.44H377.85v640.96h287.05l-99.67,114.44h-188.16c-63.63,0-115.22-51.58-115.22-115.22V488.22c0-63.63,51.58-115.22,115.22-115.22h1047.85c63.63,0,115.22,51.58,115.22,115.22Zm-620.88,488.15c-9.93-11.4-27.64-11.4-37.57,0l-349.57,401.36c-14.04,16.12-2.59,41.27,18.79,41.27h699.13c21.38,0,32.83-25.15,18.79-41.27l-349.57-401.36Z');
    addClass(airplayIcon, 'player-airplay-icon');

    return {
        play: playIcon,
        pause: pauseIcon,
        replay: replayIcon,
        circle: circle,
        fullscreenEnter: fullscreenEnterIcon,
        fullscreenExit: fullscreenExitIcon,
        PIPEnter: PIPEnterIcon,
        PIPExit: PIPExitIcon,
        airplay: airplayIcon
    };
}