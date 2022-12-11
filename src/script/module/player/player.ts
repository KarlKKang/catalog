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
    containsClass,
    addEventsListener,
    d,
    w,
    remove,
    addEventListenerOnce,
    createElement,
    appendChild
} from '../DOM';
import { IS_IOS } from '../browser';
import screenfull from 'screenfull';

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
    private readonly progressControl: HTMLElement;
    private readonly progressHolder: HTMLElement;
    private readonly loadProgress: HTMLElement;
    private readonly progressBar: HTMLElement;
    private readonly progressMouseDisplay: HTMLElement;
    private readonly timeTooltip: HTMLElement;
    private readonly durationDisplay: HTMLElement;
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

        // Container
        const controls = container;
        this.controls = controls;
        addClass(controls, 'video-js');
        controls.lang = 'en';
        controls.tabIndex = -1;
        controls.translate = false;
        addVjsClasses(controls, ['big-play-centered', 'fluid', 'controls-enabled', 'paused', 'user-active']);
        this.IS_VIDEO || addVjsClass(controls, 'audio');

        // Media
        const media = createElement(this.IS_VIDEO ? 'video' : 'audio') as HTMLVideoElement | HTMLAudioElement;
        this._media = media;
        media.tabIndex = -1;
        addVjsClass(media, 'tech');
        appendChild(controls, media);

        // Loading spinner
        const loadingSpinner = createElement('div');
        addVjsClass(loadingSpinner, 'loading-spinner');
        loadingSpinner.dir = 'ltr';
        this.IS_VIDEO && appendChild(controls, loadingSpinner);

        // Big play button
        const bigPlayButton = createElement('button') as HTMLButtonElement;
        this.bigPlayButton = bigPlayButton;
        bigPlayButton.type = 'button';
        bigPlayButton.title = 'Play Video';
        addVjsClass(bigPlayButton, 'big-play-button');
        addVjsPlaceholder(bigPlayButton);
        this.IS_VIDEO && appendChild(controls, bigPlayButton);

        // Control bar
        const controlBar = createElement('div');
        this.controlBar = controlBar;
        controlBar.dir = 'ltr';
        addVjsClass(controlBar, 'control-bar');
        appendChild(controls, controlBar);

        // Play button
        const playButton = createElement('button') as HTMLButtonElement;
        this.playButton = playButton;
        playButton.type = 'button';
        playButton.title = 'Play';
        addVjsClasses(playButton, ['play-control', 'control', 'button', 'paused']);
        addVjsPlaceholder(playButton);
        appendChild(controlBar, playButton);

        // Current time display
        const currentTimeDisplay = createElement('div');
        addVjsClasses(currentTimeDisplay, ['current-time', 'time-control', 'control']);
        appendChild(controlBar, currentTimeDisplay);

        const currentTimeDisplayText = createElement('span');
        this.currentTimeDisplay = currentTimeDisplayText;
        currentTimeDisplayText.textContent = '--:--';
        addVjsClass(currentTimeDisplayText, 'current-time-display');
        appendChild(currentTimeDisplay, currentTimeDisplayText);

        // Time divider
        const timeDivier = createElement('div');
        addVjsClasses(timeDivier, ['time-control', 'time-divider']);
        appendChild(controlBar, timeDivier);

        const timeDividerText = createElement('span');
        timeDividerText.textContent = '/';
        appendChild(timeDivier, timeDividerText);

        // Duration display
        const durationDisplay = createElement('div');
        addVjsClasses(durationDisplay, ['duration', 'time-control', 'control']);
        appendChild(controlBar, durationDisplay);

        const durationDisplayText = createElement('div');
        this.durationDisplay = durationDisplayText;
        durationDisplayText.textContent = '--:--';
        addVjsClass(durationDisplayText, 'duration-display');
        appendChild(durationDisplay, durationDisplayText);

        // Progress control
        const progressControl = createElement('div');
        this.progressControl = progressControl;
        addVjsClasses(progressControl, ['progress-control', 'control']);
        appendChild(controlBar, progressControl);

        const progressHolder = createElement('div');
        this.progressHolder = progressHolder;
        progressHolder.tabIndex = 0;
        addVjsClasses(progressHolder, ['progress-holder', 'slider', 'slider-horizontal']);
        appendChild(progressControl, progressHolder);

        // Load progress
        const loadProgress = createElement('div');
        this.loadProgress = loadProgress;
        addVjsClass(loadProgress, 'load-progress');
        loadProgress.style.width = '0%';
        appendChild(progressHolder, loadProgress);

        // Mouse display
        const mouseDisplay = createElement('div');
        this.progressMouseDisplay = mouseDisplay;
        addVjsClass(mouseDisplay, 'mouse-display');
        appendChild(progressHolder, mouseDisplay);

        // Time tooltip
        const timeTooltip = createElement('div');
        this.timeTooltip = timeTooltip;
        timeTooltip.textContent = '--:--';
        addVjsClass(timeTooltip, 'time-tooltip');
        appendChild(mouseDisplay, timeTooltip);

        // Play progress
        const playProgress = createElement('div');
        this.progressBar = playProgress;
        addVjsClasses(playProgress, ['play-progress', 'slider-bar']);
        playProgress.style.width = '0%';
        appendChild(progressHolder, playProgress);

        // PIP
        if (d.pictureInPictureEnabled) {
            const PIPbutton = createElement('button') as HTMLButtonElement;
            this.PIPButton = PIPbutton;
            PIPbutton.type = 'button';
            PIPbutton.title = 'Picture-in-Picture';
            addVjsClasses(PIPbutton, ['picture-in-picture-control', 'control', 'button']);
            addVjsPlaceholder(PIPbutton);
            this.IS_VIDEO && appendChild(controlBar, PIPbutton);
        }

        // Fullscreen
        const fullscreenButton = createElement('button') as HTMLButtonElement;
        this.fullscreenButton = fullscreenButton;
        fullscreenButton.type = 'button';
        fullscreenButton.title = 'Fullscreen';
        addVjsClasses(fullscreenButton, ['fullscreen-control', 'control', 'button']);
        addVjsPlaceholder(fullscreenButton);
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
        if (containsClass(this.controls, 'vjs-playing')) {
            this.pause();
        } else {
            this.play();
        }
    }

    private resetToActive(this: Player) {
        this.inactiveTimeout = 12;
        removeClass(this.controls, 'vjs-user-inactive');
        addClass(this.controls, 'vjs-user-active');
    }

    private attachEventListeners(this: Player) {
        //Fluid resize and duration
        addEventListener(this.media, 'loadedmetadata', this.onloadedmetadata.bind(this));

        addEventListener(this.media, 'durationchange', function (this: Player) {
            const duration = this.media.duration;
            this.durationDisplay.textContent = secToTimestamp(duration);
            this.currentTimeDisplay.textContent = secToTimestamp(this.media.currentTime, duration);
        }.bind(this));

        //Play button
        addEventListener(this.playButton, 'click', function (this: Player) {
            if (containsClass(this.controls, 'vjs-ended')) {
                removeClass(this.controls, 'vjs-ended');
                removeClass(this.playButton, 'vjs-ended');
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

            removeClass(this.controls, 'vjs-ended');
            removeClass(this.playButton, 'vjs-ended');

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
            if (containsClass(this.controls, 'vjs-fullscreen')) {
                exitFullscreen();
            } else {
                requestFullscreen();
            }
        }.bind(this);

        if (screenfull.isEnabled || IOS_FULLSCREEN) {
            removeClass(this.fullscreenButton, 'vjs-disabled');
            this.fullscreenButton.disabled = false;

            addEventListener(this.fullscreenButton, 'click', function () {
                toggleFullscreen();
            });

            if (!IOS_FULLSCREEN) {
                screenfull.on('change', function (this: Player) {
                    const elemInFS = screenfull.element;
                    if (elemInFS === undefined) {
                        removeClass(this.controls, 'vjs-fullscreen');
                        this.fullscreenButton.title = 'Fullscreen';
                    } else if (elemInFS.isSameNode(this.controls) || elemInFS.isSameNode(this.media)) {
                        addClass(this.controls, 'vjs-fullscreen');
                        this.fullscreenButton.title = 'Exit Fullscreen';
                    }
                }.bind(this));
            }
        } else {
            addClass(this.fullscreenButton, 'vjs-disabled');
            this.fullscreenButton.disabled = true;
        }

        //Picture in picture
        const PIPButton = this.PIPButton;
        if (PIPButton !== undefined) {
            addEventListener(PIPButton, 'click', function (this: Player) {
                if (containsClass(this.controls, 'vjs-picture-in-picture')) {
                    d.exitPictureInPicture();
                } else {
                    (this.media as HTMLVideoElement).requestPictureInPicture();
                }
                PIPButton.blur();
            }.bind(this));

            addEventListener(this.media, 'enterpictureinpicture', function (this: Player) {
                addClass(this.controls, 'vjs-picture-in-picture');
                PIPButton.title = 'Exit Picture-in-Picture';
            }.bind(this));

            addEventListener(this.media, 'leavepictureinpicture', function (this: Player) {
                removeClass(this.controls, 'vjs-picture-in-picture');
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
        if (this.currentTimeDisplay.textContent !== currentTimestamp) { // Setting innerHTML will force refresh even if the value is not changed.
            this.currentTimeDisplay.textContent = currentTimestamp;
        }
        this.progressBar.style.width = Math.min(this.media.currentTime / duration * 100, 100) + '%';

        if (!this.IS_VIDEO) {
            return;
        }

        if (this.inactiveTimeout > 0) {
            this.inactiveTimeout--;
            if (this.inactiveTimeout == 0) {
                removeClass(this.controls, 'vjs-user-active');
                addClass(this.controls, 'vjs-user-inactive');
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
            this.controls.style.removeProperty('padding-top');
        }
        this.durationDisplay.textContent = secToTimestamp(this.media.duration);
        if (containsClass(this.controls, 'vjs-ended')) {
            removeClass(this.controls, 'vjs-ended');
            removeClass(this.playButton, 'vjs-ended');
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
        const isTouch = w.TouchEvent !== undefined && event instanceof TouchEvent;
        let mouseX;
        if (isTouch) {
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

        if (!isTouch) {
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
            this.currentTimeDisplay.textContent = currentTimestamp;
            this.progressBar.style.width = percentage * 100 + '%';
        }

        return currentTime;
    }

    protected onplay(this: Player): void {
        this.onScreenConsoleOutput('Playback started at ' + this.media.currentTime + '.');
        addClass(this.controls, 'vjs-has-started');
        removeClass(this.playButton, 'vjs-paused');
        addClass(this.playButton, 'vjs-playing');
        removeClass(this.controls, 'vjs-paused');
        addClass(this.controls, 'vjs-playing');
        if (containsClass(this.controls, 'vjs-ended')) {
            removeClass(this.controls, 'vjs-ended');
            removeClass(this.playButton, 'vjs-ended');
        }
    }

    protected onpause(this: Player): void {
        this.onScreenConsoleOutput('Playback paused at ' + this.media.currentTime + '.');
        removeClass(this.playButton, 'vjs-playing');
        addClass(this.playButton, 'vjs-paused');
        removeClass(this.controls, 'vjs-playing');
        addClass(this.controls, 'vjs-paused');
    }

    protected onended(this: Player): void {
        this.onScreenConsoleOutput('Playback ended.');
        removeClass(this.playButton, 'vjs-playing');
        addClass(this.playButton, 'vjs-paused');
        removeClass(this.controls, 'vjs-playing');
        addClass(this.controls, 'vjs-paused');
        addClass(this.controls, 'vjs-ended');
        addClass(this.playButton, 'vjs-ended');
    }

    protected onwaiting(this: Player): void {
        this.onScreenConsoleOutput('Playback entered waiting state at ' + this.media.currentTime + '.');
        addClass(this.controls, 'vjs-seeking');
    }

    protected oncanplaythrough(this: Player): void {
        this.onScreenConsoleOutput('Playback can play through at ' + this.media.currentTime + '.');
        removeClass(this.controls, 'vjs-seeking');
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

function addVjsClass(elem: Element, className: string) {
    addClass(elem, 'vjs-' + className);
}

function addVjsClasses(elem: Element, classNames: string[]) {
    for (const className of classNames) {
        addClass(elem, 'vjs-' + className);
    }
}

function addVjsPlaceholder(elem: HTMLElement) {
    const placeholder = createElement('span');
    placeholder.ariaHidden = 'true';
    addVjsClass(placeholder, 'icon-placeholder');
    appendChild(elem, placeholder);
}