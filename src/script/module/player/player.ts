// JavaScript Document
import {
    secToTimestamp,
    removeRightClick,
    getLocalTime,
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
    appendChild,
    hideElement,
    showElement,
    createDivElement,
    createButtonElement,
    createSpanElement,
    createVideoElement,
    createAudioElement,
    appendText,
    replaceText,
} from '../dom';
import { IS_IOS } from '../browser';
import screenfull from 'screenfull';
import { addPlayerClass, addPlayerClasses, containsPlayerClass, removePlayerClass } from './helper';
import * as icons from './icons';
import { CustomMediaError } from './media_error';

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
    protected dragging = false;

    protected timer: NodeJS.Timer | undefined;
    private inactiveTimeout = 12; // 3000 / 250
    private draggingPreviewTimeout = 4; // 1000 / 250
    private droppedFrames = 0;
    private corruptedFrames = 0;

    protected readonly maxBufferHole: number = 0;
    protected readonly log: undefined | ((message: string) => void) = undefined;

    private playPromise: Promise<void> | undefined;

    public get playing(): boolean {
        return containsPlayerClass(this.controls, 'playing');
    }

    protected set playing(isPlaying: boolean) {
        if (isPlaying) {
            addPlayerClass(this.controls, 'has-started');
            addPlayerClass(this.playButton, 'playing');
            removePlayerClass(this.playButton, 'paused');
            addPlayerClass(this.controls, 'playing');
            removePlayerClass(this.controls, 'paused');
            if (this.ended) {
                this.seek(0);
            }
            this.ended = false;
        } else {
            removePlayerClass(this.playButton, 'playing');
            addPlayerClass(this.playButton, 'paused');
            removePlayerClass(this.controls, 'playing');
            addPlayerClass(this.controls, 'paused');
        }
    }

    protected get ended(): boolean {
        return containsPlayerClass(this.controls, 'ended');
    }

    protected set ended(isEnded: boolean) {
        if (isEnded) {
            removePlayerClass(this.controls, 'seeking');
            addPlayerClass(this.controls, 'ended');
            addPlayerClass(this.playButton, 'ended');
            this.pause();
        } else {
            removePlayerClass(this.controls, 'ended');
            removePlayerClass(this.playButton, 'ended');
        }
    }

    private get active(): boolean {
        return containsPlayerClass(this.controls, 'user-active');
    }

    private set active(isActive: boolean) {
        if (isActive) {
            this.inactiveTimeout = 12;
            removePlayerClass(this.controls, 'user-inactive');
            addPlayerClass(this.controls, 'user-active');
        } else {
            this.inactiveTimeout = 0;
            addPlayerClass(this.controls, 'user-inactive');
            removePlayerClass(this.controls, 'user-active');
        }
    }

    constructor(
        container: HTMLDivElement,
        config?: {
            audio?: boolean;
        }
    ) {
        config = config ?? {};
        this.IS_VIDEO = !(config.audio === true);

        if (DEVELOPMENT) {
            this.log = (message: string) => {
                const onScreenConsole = getById('on-screen-console');
                if (onScreenConsole instanceof HTMLTextAreaElement) {
                    const date = getLocalTime();
                    const newline = (date.hour < 10 ? '0' + date.hour : date.hour) + ':' + (date.minute < 10 ? '0' + date.minute : date.minute) + ':' + (date.second < 10 ? '0' + date.second : date.second) + '   ' + message + '\r\n';
                    console.log(newline);
                    onScreenConsole.value += newline;
                }
            };
        }

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
        const media = this.IS_VIDEO ? createVideoElement() : createAudioElement();
        this._media = media;
        media.tabIndex = -1;
        addPlayerClass(media, 'tech');
        appendChild(controls, media);

        // Loading spinner
        const loadingSpinner = createDivElement();
        addPlayerClass(loadingSpinner, 'loading-spinner');
        loadingSpinner.dir = 'ltr';
        this.IS_VIDEO && appendChild(controls, loadingSpinner);

        // Big play button
        const bigPlayButton = createButtonElement();
        this.bigPlayButton = bigPlayButton;
        bigPlayButton.type = 'button';
        bigPlayButton.title = 'Play Video';
        addPlayerClass(bigPlayButton, 'big-play-button');
        const bigPlayButtonPlaceholder = addPlayerPlaceholder(bigPlayButton);
        this.IS_VIDEO && appendChild(controls, bigPlayButton);

        // Control bar
        const controlBar = createDivElement();
        this.controlBar = controlBar;
        controlBar.dir = 'ltr';
        addPlayerClass(controlBar, 'control-bar');
        appendChild(controls, controlBar);

        // Play button
        const playButton = createButtonElement();
        this.playButton = playButton;
        playButton.type = 'button';
        playButton.title = 'Play';
        addPlayerClasses(playButton, ['play-control', 'control', 'button', 'paused']);
        const playButtonIconPlaceholder = addPlayerPlaceholder(playButton);
        appendChild(controlBar, playButton);

        // Current time display
        const currentTimeDisplay = createDivElement();
        this.currentTimeDisplay = currentTimeDisplay;
        addPlayerClasses(currentTimeDisplay, ['current-time', 'time-control', 'control']);
        appendChild(controlBar, currentTimeDisplay);

        const currentTimeDisplayText = createSpanElement();
        this.currentTimeDisplayText = currentTimeDisplayText;
        appendText(currentTimeDisplayText, '0:00');
        addPlayerClass(currentTimeDisplayText, 'current-time-display');
        appendChild(currentTimeDisplay, currentTimeDisplayText);

        // Time divider
        const timeDivier = createDivElement();
        this.timeDivider = timeDivier;
        addPlayerClasses(timeDivier, ['time-control', 'time-divider']);
        appendChild(controlBar, timeDivier);

        const timeDividerText = createSpanElement();
        appendText(timeDividerText, '/');
        appendChild(timeDivier, timeDividerText);

        // Duration display
        const durationDisplay = createDivElement();
        this.durationDisplay = durationDisplay;
        addPlayerClasses(durationDisplay, ['duration', 'time-control', 'control']);
        appendChild(controlBar, durationDisplay);

        const durationDisplayText = createDivElement();
        this.durationDisplayText = durationDisplayText;
        appendText(durationDisplayText, '0:00');
        addPlayerClass(durationDisplayText, 'duration-display');
        appendChild(durationDisplay, durationDisplayText);

        if (w.innerWidth < 320) {
            hideElement(currentTimeDisplay);
            hideElement(timeDivier);
            hideElement(durationDisplay);
        }

        // Progress control
        const progressControl = createDivElement();
        this.progressControl = progressControl;
        addPlayerClasses(progressControl, ['progress-control', 'control']);
        appendChild(controlBar, progressControl);

        const progressHolder = createDivElement();
        this.progressHolder = progressHolder;
        progressHolder.tabIndex = 0;
        addPlayerClasses(progressHolder, ['progress-holder', 'slider', 'slider-horizontal']);
        appendChild(progressControl, progressHolder);

        // Load progress
        const loadProgress = createDivElement();
        this.loadProgress = loadProgress;
        addPlayerClass(loadProgress, 'load-progress');
        loadProgress.style.width = '0%';
        this.IS_VIDEO && appendChild(progressHolder, loadProgress);

        // Mouse display
        const mouseDisplay = createDivElement();
        this.progressMouseDisplay = mouseDisplay;
        addPlayerClass(mouseDisplay, 'mouse-display');
        appendChild(progressHolder, mouseDisplay);

        // Time tooltip
        const timeTooltip = createDivElement();
        this.timeTooltip = timeTooltip;
        appendText(timeTooltip, '0:00');
        addPlayerClass(timeTooltip, 'time-tooltip');
        appendChild(mouseDisplay, timeTooltip);

        // Play progress
        const playProgress = createDivElement();
        this.progressBar = playProgress;
        addPlayerClasses(playProgress, ['play-progress', 'slider-bar']);
        playProgress.style.width = '0%';
        appendChild(progressHolder, playProgress);

        // PIP
        let PIPButtonPlaceholder: undefined | HTMLElement = undefined;
        if (d.pictureInPictureEnabled) {
            const PIPButton = createButtonElement();
            this.PIPButton = PIPButton;
            PIPButton.type = 'button';
            PIPButton.title = 'Picture-in-Picture';
            addPlayerClasses(PIPButton, ['picture-in-picture-control', 'control', 'button']);
            PIPButtonPlaceholder = addPlayerPlaceholder(PIPButton);
            this.IS_VIDEO && appendChild(controlBar, PIPButton);
        }

        // Fullscreen
        const fullscreenButton = createButtonElement();
        this.fullscreenButton = fullscreenButton;
        fullscreenButton.type = 'button';
        fullscreenButton.title = 'Fullscreen';
        addPlayerClasses(fullscreenButton, ['fullscreen-control', 'control', 'button']);
        const fullscreenButtonPlaceholder = addPlayerPlaceholder(fullscreenButton);
        this.IS_VIDEO && appendChild(controlBar, fullscreenButton);

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
    }

    protected preattach(this: Player) {
        this.attached = true;
        this.attachEventListeners();
        if (this.IS_VIDEO) {
            this.attachVideoEventListeners();
        }
        this.setMediaAttributes();
    }

    protected attach(this: Player, onload?: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this.preattach();

        this.media.crossOrigin = 'use-credentials';
        addEventListener(this.media, 'error', function (this: Player) {
            let errorCode = null;
            if (this.media.error !== null) {
                const code = this.media.error.code;
                if (code === MediaError.MEDIA_ERR_ABORTED) {
                    errorCode = CustomMediaError.MEDIA_ERR_ABORTED;
                } else if (code === MediaError.MEDIA_ERR_NETWORK) {
                    errorCode = CustomMediaError.MEDIA_ERR_NETWORK;
                } else if (code === MediaError.MEDIA_ERR_DECODE) {
                    errorCode = CustomMediaError.MEDIA_ERR_DECODE;
                } else if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                    errorCode = CustomMediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;
                }
            }
            onerror && onerror(errorCode);
            console.error(this.media.error);
        }.bind(this));
        addEventListener(this.media, 'loadedmetadata', function (this: any, event) {
            onload && onload.call(this, event);
        });
        this.media.volume = 1;
        DEVELOPMENT && this.log?.('Native HLS is attached.');
    }

    public load(
        this: Player,
        url: string,
        config?: {
            play?: boolean | undefined;
            startTime?: number | undefined;
            onload?: (...args: any[]) => void;
            onerror?: (errorCode: number | null) => void;
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
                const playPromise = this.media.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        if (startTime !== undefined) {
                            this.seek(startTime); // If the play promise is rejected, currentTime will be reset to 0 on older versions of Safari.
                        }
                    });
                }
            }
            if (startTime !== undefined) {
                this.seek(startTime); // Calling the play method will reset the currentTime to 0 on older versions of Safari. So it should be set after calling the play().
            }
        }.bind(this);

        addEventListenerOnce(this.media, 'loadedmetadata', callback);
        this.media.src = url;
        this.media.load();
        DEVELOPMENT && this.log?.('Native HLS source loaded.');
    }

    public destroy(this: Player) {
        this.timer && clearInterval(this.timer);
        this.pause();
        this.media.removeAttribute('src');
        this.media.load();
        remove(this.controls);
    }

    public play(this: Player) {
        this.playing = true;
        const playPromise = this.media.play();
        this.playPromise = playPromise;
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                this.playing = false;
                DEVELOPMENT && this.log?.('play promise rejected');
            });
        }
    }

    public pause(this: Player, setStatus = true) {
        if (setStatus) {
            this.playing = false; // This is necessary for the ended setter to work otherwise the player may resume playback after ended.
        }
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

    protected seekCheck(this: Player, timestamp: number): void {
        if (timestamp >= this.media.duration - this.maxBufferHole) {
            if (!this.dragging) {
                DEVELOPMENT && this.log?.('Seeked to end: ' + timestamp + '.');
                this.ended = true;
            }
        } else {
            this.ended = false;
        }
    }

    public seek(this: Player, timestamp: number) {
        this.seekCheck(timestamp);
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
        if (this.playing) {
            this.pause();
        } else {
            if (this.ended) {
                this.seek(0);
                this.ended = false;
            }
            this.play();
        }
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
            replaceText(this.durationDisplayText, secToTimestamp(duration));
            replaceText(this.currentTimeDisplayText, secToTimestamp(this.media.currentTime, duration));
        }.bind(this));

        //Play button
        addEventListener(this.playButton, 'click', function (this: Player) {
            this.togglePlayback();
            this.focus();
        }.bind(this));

        //Progress bar & frame drop monitor
        this.timer = setInterval(this.intervalCallback.bind(this), 250);

        //Progress bar
        addEventsListener(this.progressControl, ['mousedown', 'touchstart'], function (this: Player, event: Event) {
            this.dragging = true;
            this.draggingPreviewTimeout = 4;
            if (this.playing) {
                this.pause(false);
            }
            this.ended = false;
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
            if (this.dragging) {
                DEVELOPMENT && this.log?.('Playback started while dragging at ' + this.media.currentTime + '.');
                this.media.pause(); // onplay event while dragging is probably initiated by some system controls, thus it's enough to directly intercept it.
                return;
            }
            this.onplay();
        }.bind(this));

        addEventListener(this.media, 'pause', function (this: Player) {
            if (this.dragging) {
                DEVELOPMENT && this.log?.('Paused while dragging at ' + this.media.currentTime + '.');
                return;
            }
            this.onpause();
        }.bind(this));

        addEventListener(this.media, 'ended', this.onended.bind(this));

        //Redundent
        addEventListener(this.media, 'seeking', function (this: Player) {
            DEVELOPMENT && this.log?.('Seeking: ' + this.media.currentTime);
        }.bind(this));
        addEventListener(this.media, 'seeked', function (this: Player) {
            DEVELOPMENT && this.log?.('Seeked: ' + this.media.currentTime);
        }.bind(this));
    }

    private attachVideoEventListeners(this: Player) {
        //Catch events on control bar, otherwise bubbling events on the parent (constrols) will be fired.
        addEventListener(this.controlBar, 'click', (event: Event) => {
            DEVELOPMENT && this.log?.('Click on controlBar.');
            this.active = true; // There's no reset to active in listeners attached to specific buttons.
            event.stopPropagation();
        });

        //UI activity
        let touchClick = 0;
        addEventListener(this.controls, 'touchend', function (this: Player) {
            DEVELOPMENT && this.log?.('Touchend on controls.');
            touchClick++;
            setTimeout(function () { touchClick--; }, 300); // https://web.dev/mobile-touchandmouse/
        }.bind(this));
        addEventListener(this.controls, 'click', function (this: Player) {
            if (touchClick > 0) {
                DEVELOPMENT && this.log?.('Touch click on controls.');
                this.active = !this.active;
            } else {
                DEVELOPMENT && this.log?.('Mouse click on controls.');
                if (!this.ended) {
                    this.togglePlayback();
                }
            }
        }.bind(this));
        addEventListener(this.controls, 'mousemove', function (this: Player) {
            if (touchClick <= 0) {
                this.active = true;
            }
        }.bind(this));

        //Big play button
        addEventListener(this.bigPlayButton, 'click', function (this: Player, event: Event) {
            event.stopPropagation();
            this.play();
            this.focus();
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
            if (this.media.currentTime >= this.media.duration - this.maxBufferHole) {
                DEVELOPMENT && this.log?.('Playback entered waiting state before ended at ' + this.media.currentTime + '.');
                this.ended = true;
            } else {
                this.onwaiting();
            }
        }.bind(this));

        //Loading
        addEventListener(this.media, 'canplaythrough', this.oncanplaythrough.bind(this));
        addEventListenerOnce(this.media, 'canplay', function (this: Player) {
            const videoMedia = this.media as HTMLVideoElement;
            this.controls.style.paddingTop = (videoMedia.videoHeight / videoMedia.videoWidth * 100) + '%';
            DEVELOPMENT && this.log?.('Video size: ' + videoMedia.videoWidth + 'x' + videoMedia.videoHeight);
        }.bind(this));

        //Fullscreen
        const webkitEnterFullscreen = (this.media as HTMLVideoElement).webkitEnterFullscreen;
        const IOS_FULLSCREEN = IS_IOS && webkitEnterFullscreen !== undefined;
        const requestFullscreen = function (this: Player) {
            if (IOS_FULLSCREEN) {
                webkitEnterFullscreen.apply(this.media);
            } else {
                screenfull.request(this.controls);
            }

            this.focus();
        }.bind(this);

        const exitFullscreen = function (this: Player) {
            screenfull.exit();
            this.focus();
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
                this.focus();
            }.bind(this));

            addEventListener(this.media, 'enterpictureinpicture', function (this: Player) {
                addPlayerClass(this.controls, 'picture-in-picture');
                PIPButton.title = 'Exit Picture-in-Picture';
            }.bind(this));

            addEventListener(this.media, 'leavepictureinpicture', function (this: Player) {
                removePlayerClass(this.controls, 'picture-in-picture');
                PIPButton.title = 'Picture-in-Picture';
                this.focus();
            }.bind(this));
        }

        //Hotkeys
        addEventListener(this.controls, 'keydown', function (this: Player, event: Event) {
            const key = (event as KeyboardEvent).key;
            if (key === ' ' || key === 'Spacebar') {
                this.togglePlayback();
                event.preventDefault();
            } else if (key === 'f' || key === 'F') {
                toggleFullscreen();
                event.preventDefault();
            } else if (key === 'ArrowLeft' || key === 'Left') {
                this.seek(this.media.currentTime - 5);
                event.preventDefault();
            } else if (key === 'ArrowRight' || key === 'Right') {
                this.seek(this.media.currentTime + 5);
                event.preventDefault();
            } else if (key === 'ArrowUp' || key === 'Up') {
                this.seek(this.media.currentTime + 15);
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
        if (this.currentTimeDisplayText.textContent !== currentTimestamp) {
            replaceText(this.currentTimeDisplayText, currentTimestamp);
        }
        this.progressBar.style.width = Math.min(this.media.currentTime / duration * 100, 100) + '%';

        if (!this.IS_VIDEO) {
            return;
        }

        if (this.inactiveTimeout > 0) {
            this.inactiveTimeout--;
            if (this.inactiveTimeout == 0) {
                this.active = false;
            }
        }

        if (DEVELOPMENT) {
            if (typeof (this.media as HTMLVideoElement).getVideoPlaybackQuality === 'function') {
                const quality = (this.media as HTMLVideoElement).getVideoPlaybackQuality();
                if (quality.droppedVideoFrames && quality.droppedVideoFrames != this.droppedFrames) {
                    this.log?.('Frame drop detected. Total dropped: ' + quality.droppedVideoFrames);
                    this.droppedFrames = quality.droppedVideoFrames;
                }
                if (quality.corruptedVideoFrames && quality.corruptedVideoFrames != this.corruptedFrames) {
                    this.log?.('Frame corruption detected. Total corrupted: ' + quality.corruptedVideoFrames);
                    this.corruptedFrames = quality.corruptedVideoFrames;
                }
            }
        }
    }

    protected onloadedmetadata(this: Player): void {
        replaceText(this.durationDisplayText, secToTimestamp(this.media.duration));
        this.ended = false;
    }

    protected ondragended(this: Player, event: MouseEvent | TouchEvent): void {
        this.dragging = false;
        this.active = true; // The timeout won't decrease when this.dragging == true.

        const currentTime = this.progressUpdate(event);
        this.seek(currentTime);

        if (this.playing) {
            this.play();
        }
        this.focus();
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

        if (!w.matchMedia('not screen and (hover: hover) and (pointer: fine)').matches) {
            this.progressMouseDisplay.style.left = leftPadding + 'px';
            replaceText(this.timeTooltip, currentTimestamp);
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
            replaceText(this.currentTimeDisplayText, currentTimestamp);
            this.progressBar.style.width = percentage * 100 + '%';
        }
        event.preventDefault(); // If touch events are not stopped then subsequent mouse event will be fired.
        return currentTime;
    }

    protected onplay(this: Player): void {
        DEVELOPMENT && this.log?.('Playback started at ' + this.media.currentTime + '.');
        this.playing = true;
    }

    protected onpause(this: Player): void {
        DEVELOPMENT && this.log?.('Playback paused at ' + this.media.currentTime + '.');
        this.playing = false;
        this.active = true;
    }

    private onended(this: Player): void {
        DEVELOPMENT && this.log?.('Playback ended.');
        if (!this.dragging) {
            this.ended = true;
        }
    }

    protected onwaiting(this: Player): void {
        DEVELOPMENT && this.log?.('Playback entered waiting state at ' + this.media.currentTime + '.');
        addPlayerClass(this.controls, 'seeking');
    }

    protected oncanplaythrough(this: Player): void {
        DEVELOPMENT && this.log?.('Playback can play through at ' + this.media.currentTime + '.');
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
                if (nextBufferStart - this.maxBufferHole <= currentBuffer.end) {
                    DEVELOPMENT && this.log?.('Buffer hole detected: ' + currentBuffer.end + '-' + nextBufferStart + '. Duration: ' + (nextBufferStart - currentBuffer.end));
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

    public focus(this: Player) {
        this.controls.focus({ preventScroll: true });
    }
}

function addPlayerPlaceholder(elem: HTMLElement) {
    const placeholder = createSpanElement();
    // placeholder.ariaHidden = 'true';
    addPlayerClass(placeholder, 'icon-placeholder');
    appendChild(elem, placeholder);
    return placeholder;
}