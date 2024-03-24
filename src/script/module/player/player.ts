import {
    removeRightClick,
} from '../common';
import {
    addEventListener,
    addClass,
    removeClass,
    d,
    w,
    remove,
    addEventListenerOnce,
    appendChild,
    createDivElement,
    createSpanElement,
    createVideoElement,
    createAudioElement,
    appendText,
    replaceText,
    removeAllEventListeners,
    removeEventListener,
    addEventsListener,
    removeEventsListener,
    containsClass,
    createElement,
    createTextAreaElement,
    body,
} from '../dom';
import { IS_IOS } from '../browser';
import screenfull from 'screenfull';
import * as icons from './icons';
import { getLocalTime, secToTimestamp } from '../common/pure';
import { addInterval, addTimeout, removeInterval } from '../timer';
import { mediaErrorCodeLookup } from './media_error';
import * as styles from '../../../css/player.module.scss';
import { hideElement, setLeft, setPaddingTop, setRight, setWidth, showElement } from '../style';
import { CSS_UNIT } from '../style/value';
import { onScreenConsole as onScreenConsoleClass } from '../../../css/on_screen_console.module.scss';

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

    protected timer: ReturnType<typeof setInterval> | undefined;
    private inactiveTimeout = 12; // 3000 / 250
    private draggingPreviewTimeout = 4; // 1000 / 250
    private droppedFrames = 0;
    private corruptedFrames = 0;

    protected readonly maxBufferHole: number = 0;
    private onFullscreenChange: undefined | (() => void) = undefined;
    protected readonly log: undefined | ((message: string) => void) = undefined;
    private readonly onScreenConsole: undefined | HTMLTextAreaElement = undefined;

    private playPromise: Promise<void> | undefined;

    public get playing(): boolean {
        return containsClass(this.controls, styles.playerPlaying);
    }

    protected set playing(isPlaying: boolean) {
        if (isPlaying) {
            addClass(this.controls, styles.playerHasStarted);
            addClass(this.playButton, styles.playerPlaying);
            addClass(this.controls, styles.playerPlaying);
            if (this.ended) {
                this.seek(0);
            }
            this.ended = false;
        } else {
            removeClass(this.playButton, styles.playerPlaying);
            removeClass(this.controls, styles.playerPlaying);
        }
    }

    protected get ended(): boolean {
        return containsClass(this.controls, styles.playerEnded);
    }

    protected set ended(isEnded: boolean) {
        if (isEnded) {
            removeClass(this.controls, styles.playerSeeking);
            addClass(this.controls, styles.playerEnded);
            addClass(this.playButton, styles.playerEnded);
            this.pause();
        } else {
            removeClass(this.controls, styles.playerEnded);
            removeClass(this.playButton, styles.playerEnded);
        }
    }

    private get active(): boolean {
        return !containsClass(this.controls, styles.playerUserInactive);
    }

    private set active(isActive: boolean) {
        if (isActive) {
            this.inactiveTimeout = 12;
            removeClass(this.controls, styles.playerUserInactive);
        } else {
            this.inactiveTimeout = 0;
            addClass(this.controls, styles.playerUserInactive);
        }
    }

    constructor(container: HTMLDivElement, isVideo: boolean) {
        this.IS_VIDEO = isVideo;

        if (DEVELOPMENT) {
            const onScreenConsole = createTextAreaElement(20);
            this.onScreenConsole = onScreenConsole;
            addClass(onScreenConsole, onScreenConsoleClass);
            onScreenConsole.readOnly = true;
            appendChild(body, onScreenConsole);
            this.log = (message: string) => {
                const date = getLocalTime();
                const newline = (date.hour < 10 ? '0' + date.hour : date.hour) + ':' + (date.minute < 10 ? '0' + date.minute : date.minute) + ':' + (date.second < 10 ? '0' + date.second : date.second) + '   ' + message + '\r\n';
                console.log(newline);
                onScreenConsole.value += newline;
            };
        }

        // Container
        const controls = container;
        this.controls = controls;
        addClass(controls, styles.player);
        controls.lang = 'en';
        controls.tabIndex = -1;
        controls.translate = false;
        this.IS_VIDEO || addClass(controls, styles.playerAudio);
        removeRightClick(controls);

        // Media
        const media = this.IS_VIDEO ? createVideoElement() : createAudioElement();
        this._media = media;
        media.tabIndex = -1;
        addClass(media, styles.playerTech);
        appendChild(controls, media);

        // Loading spinner
        const loadingSpinner = createDivElement();
        addClass(loadingSpinner, styles.playerLoadingSpinner);
        loadingSpinner.dir = 'ltr';
        this.IS_VIDEO && appendChild(controls, loadingSpinner);

        // Big play button
        const bigPlayButtonContainer = createDivElement();
        const bigPlayButton = createPlayerButton('Play Video');
        appendChild(bigPlayButtonContainer, bigPlayButton);
        this.bigPlayButton = bigPlayButton;
        addClass(bigPlayButtonContainer, styles.playerBigPlayButton);
        const bigPlayButtonPlaceholder = addPlayerPlaceholder(bigPlayButton);
        this.IS_VIDEO && appendChild(controls, bigPlayButtonContainer);

        // Control bar
        const controlBar = createDivElement();
        this.controlBar = controlBar;
        controlBar.dir = 'ltr';
        addClass(controlBar, styles.playerControlBar);
        appendChild(controls, controlBar);

        // Play button
        const playButton = createPlayerButton('Play');
        this.playButton = playButton;
        addClass(playButton, styles.playerPlayControl, styles.playerControl, styles.playerButton);
        const playButtonIconPlaceholder = addPlayerPlaceholder(playButton);
        appendChild(controlBar, playButton);

        // Current time display
        const currentTimeDisplay = createDivElement();
        this.currentTimeDisplay = currentTimeDisplay;
        addClass(currentTimeDisplay, styles.playerTimeControl, styles.playerControl);
        appendChild(controlBar, currentTimeDisplay);

        const currentTimeDisplayText = createSpanElement('--:--');
        this.currentTimeDisplayText = currentTimeDisplayText;
        appendChild(currentTimeDisplay, currentTimeDisplayText);

        // Time divider
        const timeDivier = createDivElement();
        this.timeDivider = timeDivier;
        addClass(timeDivier, styles.playerTimeControl, styles.playerTimeDivider);
        appendChild(controlBar, timeDivier);

        const timeDividerText = createSpanElement('/');
        appendChild(timeDivier, timeDividerText);

        // Duration display
        const durationDisplay = createDivElement();
        this.durationDisplay = durationDisplay;
        addClass(durationDisplay, styles.playerTimeControl, styles.playerControl);
        appendChild(controlBar, durationDisplay);

        const durationDisplayText = createDivElement();
        this.durationDisplayText = durationDisplayText;
        appendText(durationDisplayText, '--:--');
        appendChild(durationDisplay, durationDisplayText);

        if (w.innerWidth < 320) {
            hideElement(currentTimeDisplay);
            hideElement(timeDivier);
            hideElement(durationDisplay);
        }

        // Progress control
        const progressControl = createDivElement();
        this.progressControl = progressControl;
        addClass(progressControl, styles.playerProgressControl, styles.playerControl);
        appendChild(controlBar, progressControl);

        const progressHolder = createDivElement();
        this.progressHolder = progressHolder;
        progressHolder.tabIndex = 0;
        addClass(progressHolder, styles.playerProgressHolder);
        appendChild(progressControl, progressHolder);

        // Load progress
        const loadProgress = createDivElement();
        this.loadProgress = loadProgress;
        addClass(loadProgress, styles.playerLoadProgress);
        setWidth(loadProgress, 0, CSS_UNIT.PERCENT);
        this.IS_VIDEO && appendChild(progressHolder, loadProgress);

        // Mouse display
        const mouseDisplay = createDivElement();
        this.progressMouseDisplay = mouseDisplay;
        addClass(mouseDisplay, styles.playerMouseDisplay);
        appendChild(progressHolder, mouseDisplay);

        // Time tooltip
        const timeTooltip = createDivElement();
        this.timeTooltip = timeTooltip;
        appendText(timeTooltip, '--:--');
        addClass(timeTooltip, styles.playerTimeTooltip);
        appendChild(mouseDisplay, timeTooltip);

        // Play progress
        const playProgress = createDivElement();
        this.progressBar = playProgress;
        addClass(playProgress, styles.playerPlayProgress);
        setWidth(playProgress, 0, CSS_UNIT.PERCENT);
        const playProgressIconPlaceholder = addPlayerPlaceholder(playProgress);
        appendChild(progressHolder, playProgress);

        // PIP
        let PIPButtonPlaceholder: undefined | HTMLElement = undefined;
        if (d.pictureInPictureEnabled) {
            const PIPButton = createPlayerButton('Picture-in-Picture');
            this.PIPButton = PIPButton;
            addClass(PIPButton, styles.playerPictureInPictureControl, styles.playerControl, styles.playerButton);
            PIPButtonPlaceholder = addPlayerPlaceholder(PIPButton);
            this.IS_VIDEO && appendChild(controlBar, PIPButton);
        }

        // Fullscreen
        const fullscreenButton = createPlayerButton('Fullscreen');
        this.fullscreenButton = fullscreenButton;
        addClass(fullscreenButton, styles.playerFullscreenControl, styles.playerControl, styles.playerButton);
        const fullscreenButtonPlaceholder = addPlayerPlaceholder(fullscreenButton);
        this.IS_VIDEO && appendChild(controlBar, fullscreenButton);

        appendChild(bigPlayButtonPlaceholder, icons.getPlayIcon());
        appendChild(playButtonIconPlaceholder, icons.getPlayIcon());
        appendChild(playButtonIconPlaceholder, icons.getPauseIcon());
        appendChild(playButtonIconPlaceholder, icons.getReplayIcon());
        appendChild(playProgressIconPlaceholder, icons.getCircle());
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

    protected attach(this: Player, onload: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this.preattach();

        this.media.crossOrigin = 'use-credentials';
        addEventListener(this.media, 'error', () => {
            onerror && onerror(mediaErrorCodeLookup(this.media.error));
            console.error(this.media.error);
        });
        addEventListenerOnce(this.media, 'loadedmetadata', onload);
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
        const play = config.play === true;
        const startTime = config.startTime;

        if (!this.attached) {
            const onload = config.onload;
            this.attach((event) => {
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
                onload && onload(event);
            }, config.onerror);
        }

        this.media.src = url;
        this.media.load();
        DEVELOPMENT && this.log?.('Native HLS source loaded: ' + url);
    }

    public destroy(this: Player) {
        this.timer && removeInterval(this.timer);
        this.detach();
        removeAllEventListeners(this.media);
        removeAllEventListeners(this.controls);
        removeAllEventListeners(this.playButton);
        removeAllEventListeners(this.progressControl);
        if (this.IS_VIDEO) {
            removeAllEventListeners(this.controlBar);
            removeAllEventListeners(this.bigPlayButton);
            this.PIPButton && removeAllEventListeners(this.PIPButton);
            removeAllEventListeners(this.fullscreenButton);
            this.onFullscreenChange && screenfull.off('change', this.onFullscreenChange);
        }
        removeEventListener(w, 'resize', this.onWindowResize);
        removeEventsListener(d, ['mouseup', 'touchend', 'touchcancel'], this.onMouseUp);
        remove(this.controls);
        if (DEVELOPMENT && this.onScreenConsole !== undefined) {
            remove(this.onScreenConsole);
        }
    }

    protected detach(this: Player) {
        this.pause();
        this.media.removeAttribute('src');
        this.media.load();
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

    public pause(this: Player) {
        this.playing = false; // This is necessary for the ended setter to work otherwise the player may resume playback after ended.
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
        this.onWindowResize = this.onWindowResize.bind(this);
        addEventListener(w, 'resize', this.onWindowResize);

        addEventListener(this.media, 'loadedmetadata', () => { this.onloadedmetadata(); });

        addEventListener(this.media, 'durationchange', () => {
            DEVELOPMENT && this.log?.('Duration changed: ' + this.media.duration);
            replaceText(this.durationDisplayText, secToTimestamp(this.media.duration));
        });

        //Play button
        addEventListener(this.playButton, 'click', () => {
            this.togglePlayback();
            this.focus();
        });

        //Progress bar & frame drop monitor
        this.timer = addInterval(() => { this.intervalCallback(); }, 250);

        //Progress bar
        addEventsListener(this.progressControl, ['mousedown', 'touchstart'], (event) => {
            this.dragging = true;
            this.draggingPreviewTimeout = 4;
            this.media.playbackRate = 0;
            this.ended = false;
            this.progressUpdate(event as MouseEvent | TouchEvent);
            event.preventDefault(); // Prevent triggering `mousedown` after `touchstart` on mobile devices.
        });

        this.onMouseUp = this.onMouseUp.bind(this);
        addEventsListener(d, ['mouseup', 'touchend', 'touchcancel'], this.onMouseUp);

        addEventsListener(this.progressControl, ['mousemove', 'touchmove'], (event) => {
            this.progressUpdate(event as MouseEvent | TouchEvent);
        }, { passive: true });

        //Activity on media
        addEventListener(this.media, 'play', () => { this.onplay(); });
        addEventListener(this.media, 'pause', () => { this.onpause(); });
        addEventListener(this.media, 'ended', () => { this.onended(); });

        //Redundent
        addEventListener(this.media, 'seeking', () => { this.onseeking(); });
        addEventListener(this.media, 'seeked', () => {
            DEVELOPMENT && this.log?.('Seeked: ' + this.media.currentTime);
        });
        addEventListener(this.media, 'stalled', () => {
            DEVELOPMENT && this.log?.('Playback stalled at ' + this.media.currentTime + '.');
        });
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
        addEventListener(this.controls, 'touchend', () => {
            DEVELOPMENT && this.log?.('Touchend on controls.');
            touchClick++;
            addTimeout(() => { touchClick--; }, 300); // https://web.dev/mobile-touchandmouse/
        });
        addEventListener(this.controls, 'click', () => {
            if (touchClick > 0) {
                DEVELOPMENT && this.log?.('Touch click on controls.');
                this.active = !this.active;
            } else {
                DEVELOPMENT && this.log?.('Mouse click on controls.');
                if (!this.ended) {
                    this.togglePlayback();
                }
            }
        });
        addEventListener(this.controls, 'mousemove', () => {
            if (touchClick <= 0) {
                this.active = true;
            }
        }, { passive: true });

        //Big play button
        addEventListener(this.bigPlayButton, 'click', (event) => {
            event.stopPropagation();
            this.play();
            this.focus();
            this.active = true;
        });

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
            setWidth(this.loadProgress, Math.min(Math.round(bufferEnd / this.media.duration * 100), 100), CSS_UNIT.PERCENT);
        };
        addEventListener(this.media, 'progress', () => {
            updateLoadProgress();
            addTimeout(updateLoadProgress, 1000);
        });

        addEventListener(this.media, 'waiting', () => {
            if (this.media.currentTime >= this.media.duration - this.maxBufferHole && !this.dragging) {
                DEVELOPMENT && this.log?.('Playback entered waiting state before ended at ' + this.media.currentTime + '.');
                this.ended = true;
            } else {
                this.onwaiting();
            }
        });

        //Loading
        addEventListener(this.media, 'canplaythrough', () => { this.oncanplaythrough(); });
        addEventListenerOnce(this.media, 'canplay', () => {
            const videoMedia = this.media as HTMLVideoElement;
            setPaddingTop(this.controls, videoMedia.videoHeight / videoMedia.videoWidth * 100, CSS_UNIT.PERCENT);
            DEVELOPMENT && this.log?.('Video size: ' + videoMedia.videoWidth + 'x' + videoMedia.videoHeight);
        });

        //Fullscreen
        const webkitEnterFullscreen = (this.media as HTMLVideoElement).webkitEnterFullscreen;
        const IOS_FULLSCREEN = IS_IOS && webkitEnterFullscreen !== undefined;

        const toggleFullscreen = () => {
            if (containsClass(this.controls, styles.playerFullscreen)) {
                screenfull.exit();
                this.focus();
            } else {
                if (IOS_FULLSCREEN) {
                    webkitEnterFullscreen.call(this.media);
                } else {
                    screenfull.request(this.controls);
                }
                this.focus();
            }
        };

        if (screenfull.isEnabled || IOS_FULLSCREEN) {
            removeClass(this.fullscreenButton, styles.playerDisabled);

            addEventListener(this.fullscreenButton, 'click', toggleFullscreen);

            if (!IOS_FULLSCREEN) {
                this.onFullscreenChange = () => {
                    const elemInFS = screenfull.element;
                    if (elemInFS === undefined) {
                        removeClass(this.controls, styles.playerFullscreen);
                        this.fullscreenButton.title = 'Fullscreen';
                    } else if (elemInFS.isSameNode(this.controls) || elemInFS.isSameNode(this.media)) {
                        addClass(this.controls, styles.playerFullscreen);
                        this.fullscreenButton.title = 'Exit Fullscreen';
                    }
                };
                screenfull.on('change', this.onFullscreenChange);
            }
        } else {
            addClass(this.fullscreenButton, styles.playerDisabled);
            this.fullscreenButton.title = 'Fullscreen Unavailable';
        }

        //Picture in picture
        const PIPButton = this.PIPButton;
        if (PIPButton !== undefined) {
            addEventListener(PIPButton, 'click', () => {
                if (containsClass(this.controls, styles.playerPictureInPicture)) {
                    d.exitPictureInPicture();
                } else {
                    (this.media as HTMLVideoElement).requestPictureInPicture();
                }
                this.focus();
            });

            addEventListener(this.media, 'enterpictureinpicture', () => {
                addClass(this.controls, styles.playerPictureInPicture);
                PIPButton.title = 'Exit Picture-in-Picture';
            });

            addEventListener(this.media, 'leavepictureinpicture', () => {
                removeClass(this.controls, styles.playerPictureInPicture);
                PIPButton.title = 'Picture-in-Picture';
                this.focus();
            });
        }

        //Hotkeys
        addEventListener(this.controls, 'keydown', (event) => {
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
        });
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
        setWidth(this.progressBar, Math.min(this.media.currentTime / duration * 100, 100), CSS_UNIT.PERCENT);

        if (!this.IS_VIDEO) {
            return;
        }

        if (this.inactiveTimeout > 0) {
            this.inactiveTimeout--;
            if (this.inactiveTimeout === 0) {
                this.active = false;
            }
        }

        if (DEVELOPMENT) {
            if (typeof (this.media as HTMLVideoElement).getVideoPlaybackQuality === 'function') {
                const quality = (this.media as HTMLVideoElement).getVideoPlaybackQuality();
                if (quality.droppedVideoFrames && quality.droppedVideoFrames !== this.droppedFrames) {
                    this.log?.('Frame drop detected. Total dropped: ' + quality.droppedVideoFrames);
                    this.droppedFrames = quality.droppedVideoFrames;
                }
                if (quality.corruptedVideoFrames && quality.corruptedVideoFrames !== this.corruptedFrames) {
                    this.log?.('Frame corruption detected. Total corrupted: ' + quality.corruptedVideoFrames);
                    this.corruptedFrames = quality.corruptedVideoFrames;
                }
            }
        }
    }

    protected onloadedmetadata(this: Player): void {
        DEVELOPMENT && this.log?.('Loaded metadata.');
        replaceText(this.durationDisplayText, secToTimestamp(this.media.duration));
        this.ended = false;
    }

    protected ondragended(this: Player, event: MouseEvent | TouchEvent): void {
        this.dragging = false;
        this.active = true; // The timeout won't decrease when this.dragging == true.

        const currentTime = this.progressUpdate(event);
        event.preventDefault(); // Prevent triggering mouse events after `touchend` on mobile devices.
        this.seek(currentTime);

        this.media.playbackRate = 1;
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
            setLeft(this.progressMouseDisplay, leftPadding, CSS_UNIT.PX);
            replaceText(this.timeTooltip, currentTimestamp);
            setRight(this.timeTooltip, -this.timeTooltip.offsetWidth / 2, CSS_UNIT.PX);
            if (currentTime > this.media.currentTime) {
                removeClass(this.progressMouseDisplay, styles.playerMouseDisplayBackward);
                addClass(this.progressMouseDisplay, styles.playerMouseDisplayForward);
            } else {
                removeClass(this.progressMouseDisplay, styles.playerMouseDisplayForward);
                addClass(this.progressMouseDisplay, styles.playerMouseDisplayBackward);
            }
        }
        if (this.dragging) {
            if (this.draggingPreviewTimeout === 0) {
                this.seek(currentTime);
                this.draggingPreviewTimeout = 4;
            }
            replaceText(this.currentTimeDisplayText, currentTimestamp);
            setWidth(this.progressBar, percentage * 100, CSS_UNIT.PERCENT);
        }
        return currentTime;
    }

    protected onplay(this: Player): void {
        DEVELOPMENT && this.log?.('Playback started at ' + this.media.currentTime + '.');
        this.playing = true;
    }

    private onpause(this: Player): void {
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
        addClass(this.controls, styles.playerSeeking);
    }

    protected oncanplaythrough(this: Player): void {
        DEVELOPMENT && this.log?.('Playback can play through at ' + this.media.currentTime + '.');
        removeClass(this.controls, styles.playerSeeking);
    }

    protected onseeking(this: Player): void {
        DEVELOPMENT && this.log?.('Seeking: ' + this.media.currentTime + '.');
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

    private onWindowResize(this: Player) {
        let func = showElement;
        if (w.innerWidth < 320) {
            func = hideElement;
        }
        func(this.currentTimeDisplay);
        func(this.timeDivider);
        func(this.durationDisplay);
    }

    private onMouseUp(this: Player, event: Event) {
        if (this.dragging) {
            this.ondragended(event as MouseEvent | TouchEvent);
        }
    }
}

function addPlayerPlaceholder(elem: HTMLElement) {
    const placeholder = createSpanElement();
    // placeholder.ariaHidden = 'true';
    addClass(placeholder, styles.playerIconPlaceholder);
    appendChild(elem, placeholder);
    return placeholder;
}

function createPlayerButton(title: string) {
    const elem = createElement('button') as HTMLButtonElement;
    elem.type = 'button';
    elem.title = title;
    return elem;
}