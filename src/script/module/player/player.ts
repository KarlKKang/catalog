import { removeRightClick } from '../dom/element/remove_right_click';
import { remove } from '../dom/node/remove';
import { appendChild } from '../dom/node/append_child';
import { addClass } from '../dom/class/add';
import { removeClass } from '../dom/class/remove';
import { containsClass } from '../dom/class/contains';
import { createTextAreaElement } from '../dom/element/text_area/create';
import { replaceText } from '../dom/element/text/replace';
import { appendText } from '../dom/element/text/append';
import { createAudioElement } from '../dom/element/audio/create';
import { createVideoElement } from '../dom/element/video/create';
import { createSpanElement } from '../dom/element/span/create';
import { createDivElement } from '../dom/element/div/create';
import { body } from '../dom/body';
import { d } from '../dom/document';
import { w } from '../dom/window';
import { removeAllEventListeners } from '../event_listener/remove/all_listeners';
import { addEventListenerOnce } from '../event_listener/add/once';
import { removeEventsListener } from '../event_listener/remove/multiple_events';
import { removeEventListener } from '../event_listener/remove';
import { addEventsListener } from '../event_listener/add/multiple_events';
import { addEventListener } from '../event_listener/add';
import { IS_IOS } from '../browser/is_ios';
import screenfull from 'screenfull';
import * as icons from './icons';
import { padNumberLeft } from '../string/pad_number_left';
import { toTimestampString } from '../string/timestamp';
import { TimeInfoKey, getLocalTime } from '../time/local';
import type { Timeout, Interval } from '../timer/type';
import { removeInterval } from '../timer/remove/interval';
import { addInterval } from '../timer/add/interval';
import { addTimeout } from '../timer/add/timeout';
import { mediaErrorCodeLookup } from './media_error';
import * as styles from '../../../css/player.module.scss';
import { showElement } from '../style/show_element';
import { hideElement } from '../style/hide_element';
import { setRight } from '../style/right';
import { setLeft } from '../style/left';
import { setPaddingTop } from '../style/padding_top';
import { setWidth } from '../style/width';
import { CSS_UNIT } from '../style/value/unit';
import { onScreenConsole as onScreenConsoleClass } from '../../../css/on_screen_console.module.scss';
import { PlayerKey } from './player_key';
import { addMouseTouchEventListener } from '../event_listener/add/mouse_touch_event';
import { EN_LANG_CODE } from '../lang/en';
import { createNativeButtonElement } from '../dom/element/button/native/create';
import { max, min, round } from '../math';
import { removeTimeout } from '../timer/remove/timeout';
import { IS_IOS_PWA } from '../browser/is_ios_pwa';
import { disableButton } from '../dom/element/button/disable';
import { consoleError } from '../console';

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
    protected readonly [PlayerKey.IS_VIDEO]: boolean;
    private readonly [PlayerKey._MEDIA]: HTMLVideoElement | HTMLAudioElement;
    public get [PlayerKey.MEDIA]() { return this[PlayerKey._MEDIA]; }
    protected readonly [PlayerKey.MAX_BUFFER_HOLE]: number = 0;
    protected readonly [PlayerKey.LOG]: undefined | ((message: string) => void) = undefined;
    private readonly [PlayerKey.ON_SCREEN_CONSOLE]: undefined | HTMLTextAreaElement = undefined;

    public readonly [PlayerKey.CONTROLS]: HTMLElement;
    public readonly [PlayerKey.BIG_PLAY_BUTTON]: HTMLButtonElement;
    private readonly [PlayerKey.CONTROL_BAR]: HTMLElement;
    private readonly [PlayerKey.PLAY_BUTTON]: HTMLElement;
    private readonly [PlayerKey.CURRENT_TIME_DISPLAY]: HTMLElement;
    private readonly [PlayerKey.CURRENT_TIME_DISPLAY_TEXT]: HTMLElement;
    private readonly [PlayerKey.PROGRESS_CONTROL]: HTMLElement;
    private readonly [PlayerKey.PROGRESS_HOLDER]: HTMLElement;
    private readonly [PlayerKey.LOAD_PROGRESS]: HTMLElement;
    private readonly [PlayerKey.PROGRESS_BAR]: HTMLElement;
    private readonly [PlayerKey.PROGRESS_MOUSE_DISPLAY]: HTMLElement;
    private readonly [PlayerKey.TIME_TOOLTIP]: HTMLElement;
    private readonly [PlayerKey.DURATION_DISPLAY]: HTMLElement;
    private readonly [PlayerKey.DURATION_DISPLAY_TEXT]: HTMLElement;
    private readonly [PlayerKey.TIME_DIVIDER]: HTMLElement;
    private readonly [PlayerKey.PIP_BUTTON]: HTMLButtonElement | undefined;
    private readonly [PlayerKey.FULLSCREEN_BUTTON]: HTMLButtonElement;

    private [PlayerKey.TIMER]: Interval | undefined;
    private [PlayerKey.UPDATE_LOAD_PROGRESS_TIMEOUT]: Timeout | null = null;
    private [PlayerKey.ON_FULLSCREEN_CHANGE]: undefined | (() => void) = undefined;
    private [PlayerKey.INACTIVE_TIMEOUT] = 12; // 3000 / 250
    private [PlayerKey.DRAGGING_PREVIEW_TIMEOUT] = 4; // 1000 / 250
    private [PlayerKey.DROPPED_FRAMES] = 0;
    private [PlayerKey.CORRUPTED_FRAMES] = 0;
    private [PlayerKey.PLAY_PROMISE]: Promise<void> | undefined;
    protected [PlayerKey.ATTACHED] = false;
    protected [PlayerKey.DRAGGING] = false;

    public get [PlayerKey.PLAYING](): boolean {
        return containsClass(this[PlayerKey.CONTROLS], styles.playerPlaying);
    }

    protected set [PlayerKey.PLAYING](isPlaying: boolean) {
        if (isPlaying) {
            addClass(this[PlayerKey.CONTROLS], styles.playerHasStarted);
            addClass(this[PlayerKey.PLAY_BUTTON], styles.playerPlaying);
            addClass(this[PlayerKey.CONTROLS], styles.playerPlaying);
            if (this[PlayerKey.ENDED]) {
                this[PlayerKey.SEEK](0);
            }
        } else {
            removeClass(this[PlayerKey.PLAY_BUTTON], styles.playerPlaying);
            removeClass(this[PlayerKey.CONTROLS], styles.playerPlaying);
        }
    }

    protected get [PlayerKey.ENDED](): boolean {
        return containsClass(this[PlayerKey.CONTROLS], styles.playerEnded);
    }

    protected set [PlayerKey.ENDED](isEnded: boolean) {
        if (isEnded) {
            removeClass(this[PlayerKey.CONTROLS], styles.playerSeeking);
            addClass(this[PlayerKey.CONTROLS], styles.playerEnded);
            addClass(this[PlayerKey.PLAY_BUTTON], styles.playerEnded);
            this[PlayerKey.PAUSE]();
        } else {
            removeClass(this[PlayerKey.CONTROLS], styles.playerEnded);
            removeClass(this[PlayerKey.PLAY_BUTTON], styles.playerEnded);
        }
    }

    private get [PlayerKey.ACTIVE](): boolean {
        return !containsClass(this[PlayerKey.CONTROLS], styles.playerUserInactive);
    }

    private set [PlayerKey.ACTIVE](isActive: boolean) {
        if (isActive) {
            this[PlayerKey.INACTIVE_TIMEOUT] = 12;
            removeClass(this[PlayerKey.CONTROLS], styles.playerUserInactive);
        } else {
            this[PlayerKey.INACTIVE_TIMEOUT] = 0;
            addClass(this[PlayerKey.CONTROLS], styles.playerUserInactive);
        }
    }

    constructor(container: HTMLDivElement, isVideo: boolean) {
        this[PlayerKey.IS_VIDEO] = isVideo;

        if (ENABLE_DEBUG) {
            const onScreenConsole = createTextAreaElement(20);
            this[PlayerKey.ON_SCREEN_CONSOLE] = onScreenConsole;
            addClass(onScreenConsole, onScreenConsoleClass);
            onScreenConsole.readOnly = true;
            appendChild(body, onScreenConsole);
            this[PlayerKey.LOG] = (message: string) => {
                const date = getLocalTime();
                const newline = padNumberLeft(date[TimeInfoKey.HOUR], 2) + ':' + padNumberLeft(date[TimeInfoKey.MINUTE], 2) + ':' + padNumberLeft(date[TimeInfoKey.SECOND], 2) + '   ' + message + '\r\n';
                console.log(newline);
                onScreenConsole.value += newline;
            };
        }

        // Container
        const controls = container;
        this[PlayerKey.CONTROLS] = controls;
        addClass(controls, styles.player);
        controls.lang = EN_LANG_CODE;
        controls.tabIndex = -1;
        controls.translate = false;
        this[PlayerKey.IS_VIDEO] || addClass(controls, styles.playerAudio);
        removeRightClick(controls);

        // Media
        const media = this[PlayerKey.IS_VIDEO] ? createVideoElement() : createAudioElement();
        this[PlayerKey._MEDIA] = media;
        media.tabIndex = -1;
        addClass(media, styles.playerTech);
        appendChild(controls, media);

        // Loading spinner
        const loadingSpinner = createDivElement();
        addClass(loadingSpinner, styles.playerLoadingSpinner);
        loadingSpinner.dir = 'ltr';
        this[PlayerKey.IS_VIDEO] && appendChild(controls, loadingSpinner);

        // Big play button
        const bigPlayButtonContainer = createDivElement();
        const bigPlayButton = createPlayerButton('Play Video');
        appendChild(bigPlayButtonContainer, bigPlayButton);
        this[PlayerKey.BIG_PLAY_BUTTON] = bigPlayButton;
        addClass(bigPlayButtonContainer, styles.playerBigPlayButton);
        const bigPlayButtonPlaceholder = addPlayerPlaceholder(bigPlayButton);
        this[PlayerKey.IS_VIDEO] && appendChild(controls, bigPlayButtonContainer);

        // Control bar
        const controlBar = createDivElement();
        this[PlayerKey.CONTROL_BAR] = controlBar;
        controlBar.dir = 'ltr';
        addClass(controlBar, styles.playerControlBar);
        appendChild(controls, controlBar);

        // Play button
        const playButton = createPlayerButton('Play');
        this[PlayerKey.PLAY_BUTTON] = playButton;
        addClass(playButton, styles.playerPlayControl, styles.playerButton);
        const playButtonIconPlaceholder = addPlayerPlaceholder(playButton);
        appendChild(controlBar, playButton);

        // Current time display
        const currentTimeDisplay = createDivElement();
        this[PlayerKey.CURRENT_TIME_DISPLAY] = currentTimeDisplay;
        addClass(currentTimeDisplay, styles.playerTimeControl);
        appendChild(controlBar, currentTimeDisplay);

        const currentTimeDisplayText = createSpanElement('--:--');
        this[PlayerKey.CURRENT_TIME_DISPLAY_TEXT] = currentTimeDisplayText;
        appendChild(currentTimeDisplay, currentTimeDisplayText);

        // Time divider
        const timeDivier = createDivElement();
        this[PlayerKey.TIME_DIVIDER] = timeDivier;
        addClass(timeDivier, styles.playerTimeControl, styles.playerTimeDivider);
        appendChild(controlBar, timeDivier);

        const timeDividerText = createSpanElement('/');
        appendChild(timeDivier, timeDividerText);

        // Duration display
        const durationDisplay = createDivElement();
        this[PlayerKey.DURATION_DISPLAY] = durationDisplay;
        addClass(durationDisplay, styles.playerTimeControl);
        appendChild(controlBar, durationDisplay);

        const durationDisplayText = createDivElement();
        this[PlayerKey.DURATION_DISPLAY_TEXT] = durationDisplayText;
        appendText(durationDisplayText, '--:--');
        appendChild(durationDisplay, durationDisplayText);

        if (w.innerWidth < 320) {
            hideElement(currentTimeDisplay);
            hideElement(timeDivier);
            hideElement(durationDisplay);
        }

        // Progress control
        const progressControl = createDivElement();
        this[PlayerKey.PROGRESS_CONTROL] = progressControl;
        addClass(progressControl, styles.playerProgressControl);
        appendChild(controlBar, progressControl);

        const progressHolder = createDivElement();
        this[PlayerKey.PROGRESS_HOLDER] = progressHolder;
        progressHolder.tabIndex = 0;
        addClass(progressHolder, styles.playerProgressHolder);
        appendChild(progressControl, progressHolder);

        // Load progress
        const loadProgress = createDivElement();
        this[PlayerKey.LOAD_PROGRESS] = loadProgress;
        addClass(loadProgress, styles.playerLoadProgress);
        setWidth(loadProgress, 0, CSS_UNIT.PERCENT);
        this[PlayerKey.IS_VIDEO] && appendChild(progressHolder, loadProgress);

        // Mouse display
        const mouseDisplay = createDivElement();
        this[PlayerKey.PROGRESS_MOUSE_DISPLAY] = mouseDisplay;
        addClass(mouseDisplay, styles.playerMouseDisplay);
        appendChild(progressHolder, mouseDisplay);

        // Time tooltip
        const timeTooltip = createDivElement();
        this[PlayerKey.TIME_TOOLTIP] = timeTooltip;
        appendText(timeTooltip, '--:--');
        addClass(timeTooltip, styles.playerTimeTooltip);
        appendChild(mouseDisplay, timeTooltip);

        // Play progress
        const playProgress = createDivElement();
        this[PlayerKey.PROGRESS_BAR] = playProgress;
        addClass(playProgress, styles.playerPlayProgress);
        setWidth(playProgress, 0, CSS_UNIT.PERCENT);
        const playProgressIconPlaceholder = addPlayerPlaceholder(playProgress);
        appendChild(progressHolder, playProgress);

        // PIP
        let PIPButtonPlaceholder: undefined | HTMLElement = undefined;
        if (d.pictureInPictureEnabled && !IS_IOS_PWA) {
            const PIPButton = createPlayerButton('Picture-in-Picture');
            this[PlayerKey.PIP_BUTTON] = PIPButton;
            addClass(PIPButton, styles.playerPictureInPictureControl, styles.playerButton);
            PIPButtonPlaceholder = addPlayerPlaceholder(PIPButton);
            this[PlayerKey.IS_VIDEO] && appendChild(controlBar, PIPButton);
        }

        // Fullscreen
        const fullscreenButton = createPlayerButton('Fullscreen');
        this[PlayerKey.FULLSCREEN_BUTTON] = fullscreenButton;
        addClass(fullscreenButton, styles.playerFullscreenControl, styles.playerButton);
        const fullscreenButtonPlaceholder = addPlayerPlaceholder(fullscreenButton);
        this[PlayerKey.IS_VIDEO] && appendChild(controlBar, fullscreenButton);

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

    protected [PlayerKey.PRE_ATTACH](this: Player) {
        this[PlayerKey.ATTACHED] = true;
        this[PlayerKey.ATTACH_EVENT_LISTENERS]();
        if (this[PlayerKey.IS_VIDEO]) {
            this[PlayerKey.ATTACH_VIDEO_EVENT_LISTENERS]();
        }
        this[PlayerKey.SET_MEDIA_ATTRIBUTES]();
    }

    protected [PlayerKey.ATTACH](this: Player, onload: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this[PlayerKey.PRE_ATTACH]();

        this[PlayerKey.MEDIA].crossOrigin = 'use-credentials';
        addEventListener(this[PlayerKey.MEDIA], 'error', () => {
            onerror && onerror(mediaErrorCodeLookup(this[PlayerKey.MEDIA].error));
            consoleError(this[PlayerKey.MEDIA].error);
        });
        addEventListenerOnce(this[PlayerKey.MEDIA], 'loadedmetadata', onload);
        this[PlayerKey.MEDIA].volume = 1;
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Native HLS is attached.');
    }

    public [PlayerKey.LOAD](
        this: Player,
        url: string,
        config?: {
            play?: boolean | undefined;
            startTime?: number | undefined;
            onload?: (...args: any[]) => void;
            onerror?: (errorCode: number | null) => void;
        },
    ): void {
        config = config ?? {};
        const play = config.play === true;
        const startTime = config.startTime;

        if (!this[PlayerKey.ATTACHED]) {
            const onload = config.onload;
            this[PlayerKey.ATTACH]((event) => {
                if (play) {
                    const playPromise = this[PlayerKey.MEDIA].play();
                    if (playPromise !== undefined) {
                        playPromise.catch(() => {
                            if (startTime !== undefined) {
                                this[PlayerKey.SEEK](startTime); // If the play promise is rejected, currentTime will be reset to 0 on older versions of Safari.
                            }
                        });
                    }
                }
                if (startTime !== undefined) {
                    this[PlayerKey.SEEK](startTime); // Calling the play method will reset the currentTime to 0 on older versions of Safari. So it should be set after calling the play().
                }
                onload && onload(event);
            }, config.onerror);
        }

        this[PlayerKey.MEDIA].src = url;
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Native HLS source loaded: ' + url);
    }

    public [PlayerKey.DESTROY](this: Player) {
        this[PlayerKey.TIMER] && removeInterval(this[PlayerKey.TIMER]);
        removeAllEventListeners(this[PlayerKey.MEDIA]);
        removeAllEventListeners(this[PlayerKey.CONTROLS]);
        removeAllEventListeners(this[PlayerKey.PLAY_BUTTON]);
        removeAllEventListeners(this[PlayerKey.PROGRESS_CONTROL]);
        if (this[PlayerKey.IS_VIDEO]) {
            this[PlayerKey.UPDATE_LOAD_PROGRESS_TIMEOUT] && removeTimeout(this[PlayerKey.UPDATE_LOAD_PROGRESS_TIMEOUT]);
            removeAllEventListeners(this[PlayerKey.CONTROL_BAR]);
            removeAllEventListeners(this[PlayerKey.BIG_PLAY_BUTTON]);
            this[PlayerKey.PIP_BUTTON] && removeAllEventListeners(this[PlayerKey.PIP_BUTTON]);
            removeAllEventListeners(this[PlayerKey.FULLSCREEN_BUTTON]);
            this[PlayerKey.ON_FULLSCREEN_CHANGE] && screenfull.off('change', this[PlayerKey.ON_FULLSCREEN_CHANGE]);
        }
        removeEventListener(w, 'resize', this[PlayerKey.ON_WINDOW_RESIZE]);
        removeEventsListener(d, ['mouseup', 'touchend', 'touchcancel'], this[PlayerKey.ON_MOUSE_UP]);
        remove(this[PlayerKey.CONTROLS]);
        if (ENABLE_DEBUG && this[PlayerKey.ON_SCREEN_CONSOLE] !== undefined) {
            remove(this[PlayerKey.ON_SCREEN_CONSOLE]);
        }
        this[PlayerKey.DETACH]();
    }

    protected [PlayerKey.DETACH](this: Player) {
        this[PlayerKey.PAUSE]();
        this[PlayerKey.MEDIA].removeAttribute('src');
        this[PlayerKey.MEDIA].load();
    }

    public [PlayerKey.PLAY](this: Player) {
        this[PlayerKey.PLAYING] = true;
        const playPromise = this[PlayerKey.MEDIA].play();
        this[PlayerKey.PLAY_PROMISE] = playPromise;
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                this[PlayerKey.PLAYING] = false;
                ENABLE_DEBUG && this[PlayerKey.LOG]?.('play promise rejected');
            });
        }
    }

    public [PlayerKey.PAUSE](this: Player) {
        this[PlayerKey.PLAYING] = false; // This is necessary for the ended setter to work otherwise the player may resume playback after ended.
        const playPromise = this[PlayerKey.PLAY_PROMISE];
        if (this[PlayerKey.PLAY_PROMISE] === undefined) {
            this[PlayerKey.MEDIA].pause();
        } else {
            this[PlayerKey.PLAY_PROMISE].then(() => {
                if (this[PlayerKey.PLAY_PROMISE] === playPromise) {
                    this[PlayerKey.MEDIA].pause();
                }
            });
        }
    }

    protected [PlayerKey.END_CHECK](this: Player, timestamp: number): void {
        if (timestamp >= this[PlayerKey.MEDIA].duration - this[PlayerKey.MAX_BUFFER_HOLE]) {
            if (!this[PlayerKey.DRAGGING]) {
                ENABLE_DEBUG && this[PlayerKey.LOG]?.('Seeked to end: ' + timestamp + '.');
                this[PlayerKey.ENDED] = true;
            }
        } else {
            this[PlayerKey.ENDED] = false;
        }
    }

    public [PlayerKey.SEEK](this: Player, timestamp: number, callback?: () => void) {
        this[PlayerKey.END_CHECK](timestamp);
        this[PlayerKey.MEDIA].currentTime = timestamp;
        callback?.();
    }

    private [PlayerKey.SET_MEDIA_ATTRIBUTES](this: Player) {
        if (typeof this[PlayerKey.MEDIA].preload !== 'undefined') {
            this[PlayerKey.MEDIA].preload = 'metadata';
        }
        if (typeof this[PlayerKey.MEDIA].controlsList !== 'undefined') {
            if (this[PlayerKey.MEDIA].controlsList.supports('nodownload')) {
                this[PlayerKey.MEDIA].controlsList.add('nodownload');
            }
            if (this[PlayerKey.MEDIA].controlsList.supports('noplaybackrate')) {
                this[PlayerKey.MEDIA].controlsList.add('noplaybackrate');
            }
        }

        if (this[PlayerKey.MEDIA] instanceof HTMLVideoElement) {
            if (typeof this[PlayerKey.MEDIA].playsInline !== 'undefined') {
                this[PlayerKey.MEDIA].playsInline = true;
            }
            if (typeof this[PlayerKey.MEDIA].autoPictureInPicture !== 'undefined') {
                this[PlayerKey.MEDIA].autoPictureInPicture = true;
            }
        }
    }

    protected [PlayerKey.TOGGLE_PLAYBACK](this: Player) {
        if (this[PlayerKey.PLAYING]) {
            this[PlayerKey.PAUSE]();
        } else {
            if (this[PlayerKey.ENDED]) {
                this[PlayerKey.SEEK](0, () => {
                    this[PlayerKey.PLAY]();
                });
            } else {
                this[PlayerKey.PLAY]();
            }
        }
    }

    private [PlayerKey.ATTACH_EVENT_LISTENERS](this: Player) {
        // Fluid resize and duration
        this[PlayerKey.ON_WINDOW_RESIZE] = this[PlayerKey.ON_WINDOW_RESIZE].bind(this);
        addEventListener(w, 'resize', this[PlayerKey.ON_WINDOW_RESIZE]);

        addEventListener(this[PlayerKey.MEDIA], 'loadedmetadata', () => {
            this[PlayerKey.ON_LOADED_METADATA]();
        });

        addEventListener(this[PlayerKey.MEDIA], 'durationchange', () => {
            ENABLE_DEBUG && this[PlayerKey.LOG]?.('Duration changed: ' + this[PlayerKey.MEDIA].duration);
            this[PlayerKey.END_CHECK](this[PlayerKey.MEDIA].currentTime);
            replaceText(this[PlayerKey.DURATION_DISPLAY_TEXT], toTimestampString(this[PlayerKey.MEDIA].duration));
        });

        // Play button
        addEventListener(this[PlayerKey.PLAY_BUTTON], 'click', () => {
            this[PlayerKey.TOGGLE_PLAYBACK]();
            this[PlayerKey.FOCUS]();
        });

        // Progress bar & frame drop monitor
        this[PlayerKey.TIMER] = addInterval(() => {
            this[PlayerKey.INTERVAL_CALLBACK]();
        }, 250);

        // Progress bar
        addEventsListener(this[PlayerKey.PROGRESS_CONTROL], ['mousedown', 'touchstart'], (event) => {
            this[PlayerKey.DRAGGING] = true;
            this[PlayerKey.DRAGGING_PREVIEW_TIMEOUT] = 4;
            this[PlayerKey.MEDIA].playbackRate = 0;
            this[PlayerKey.ENDED] = false;
            this[PlayerKey.PROGRESS_UPDATE](event as MouseEvent | TouchEvent);
            event.preventDefault(); // Prevent triggering `mousedown` after `touchstart` on mobile devices.
        });

        this[PlayerKey.ON_MOUSE_UP] = this[PlayerKey.ON_MOUSE_UP].bind(this);
        addEventsListener(d, ['mouseup', 'touchend', 'touchcancel'], this[PlayerKey.ON_MOUSE_UP]);

        addEventsListener(this[PlayerKey.PROGRESS_CONTROL], ['mousemove', 'touchmove'], (event) => {
            this[PlayerKey.PROGRESS_UPDATE](event as MouseEvent | TouchEvent);
        }, { passive: true });

        // Activity on media
        addEventListener(this[PlayerKey.MEDIA], 'play', () => {
            this[PlayerKey.ON_PLAY]();
        });
        addEventListener(this[PlayerKey.MEDIA], 'pause', () => {
            this[PlayerKey.ON_PAUSE]();
        });
        addEventListener(this[PlayerKey.MEDIA], 'ended', () => {
            this[PlayerKey.ON_ENDED]();
        });

        // Redundent
        addEventListener(this[PlayerKey.MEDIA], 'seeking', () => {
            this[PlayerKey.ON_SEEKING]();
        });
        addEventListener(this[PlayerKey.MEDIA], 'seeked', () => {
            ENABLE_DEBUG && this[PlayerKey.LOG]?.('Seeked: ' + this[PlayerKey.MEDIA].currentTime);
        });
        addEventListener(this[PlayerKey.MEDIA], 'stalled', () => {
            ENABLE_DEBUG && this[PlayerKey.LOG]?.('Playback stalled at ' + this[PlayerKey.MEDIA].currentTime + '.');
        });
    }

    private [PlayerKey.ATTACH_VIDEO_EVENT_LISTENERS](this: Player) {
        // Catch events on control bar, otherwise bubbling events on the parent (constrols) will be fired.
        addEventListener(this[PlayerKey.CONTROL_BAR], 'click', (event: Event) => {
            ENABLE_DEBUG && this[PlayerKey.LOG]?.('Click on controlBar.');
            this[PlayerKey.ACTIVE] = true; // There's no reset to active in listeners attached to specific buttons.
            event.stopPropagation();
        });

        // UI activity
        addMouseTouchEventListener(
            this[PlayerKey.CONTROLS],
            (isMouseClick) => {
                if (isMouseClick) {
                    ENABLE_DEBUG && this[PlayerKey.LOG]?.('Mouse click on controls.');
                    if (!this[PlayerKey.ENDED]) {
                        this[PlayerKey.TOGGLE_PLAYBACK]();
                    }
                } else {
                    ENABLE_DEBUG && this[PlayerKey.LOG]?.('Touch click on controls.');
                    this[PlayerKey.ACTIVE] = !this[PlayerKey.ACTIVE];
                }
            },
            () => {
                this[PlayerKey.ACTIVE] = true;
            },
        );

        // Big play button
        addEventListener(this[PlayerKey.BIG_PLAY_BUTTON], 'click', (event) => {
            event.stopPropagation();
            this[PlayerKey.PLAY]();
            this[PlayerKey.FOCUS]();
            this[PlayerKey.ACTIVE] = true;
        });

        // Load progress
        const updateLoadProgress = () => {
            let bufferEnd = 0;
            const bufferedRange = this[PlayerKey.GET_BUFFERED_RANGE]();
            for (const buffer of bufferedRange) {
                if (buffer.start > this[PlayerKey.MEDIA].currentTime) {
                    break;
                }
                bufferEnd = buffer.end;
            }
            setWidth(this[PlayerKey.LOAD_PROGRESS], min(round(bufferEnd / this[PlayerKey.MEDIA].duration * 100), 100), CSS_UNIT.PERCENT);
        };
        addEventListener(this[PlayerKey.MEDIA], 'progress', () => {
            updateLoadProgress();
            this[PlayerKey.UPDATE_LOAD_PROGRESS_TIMEOUT] && removeTimeout(this[PlayerKey.UPDATE_LOAD_PROGRESS_TIMEOUT]);
            this[PlayerKey.UPDATE_LOAD_PROGRESS_TIMEOUT] = addTimeout(() => {
                this[PlayerKey.UPDATE_LOAD_PROGRESS_TIMEOUT] = null;
                updateLoadProgress();
            }, 1000);
        });

        addEventListener(this[PlayerKey.MEDIA], 'waiting', () => {
            this[PlayerKey.END_CHECK](this[PlayerKey.MEDIA].currentTime);
            if (!this[PlayerKey.ENDED]) {
                this[PlayerKey.ON_WAITING]();
            }
        });

        // Loading
        addEventListener(this[PlayerKey.MEDIA], 'canplaythrough', () => {
            this[PlayerKey.ON_CAN_PLAY_THROUGH]();
        });
        addEventListenerOnce(this[PlayerKey.MEDIA], 'canplay', () => {
            const videoMedia = this[PlayerKey.MEDIA] as HTMLVideoElement;
            setPaddingTop(this[PlayerKey.CONTROLS], videoMedia.videoHeight / videoMedia.videoWidth * 100, CSS_UNIT.PERCENT);
            ENABLE_DEBUG && this[PlayerKey.LOG]?.('Video size: ' + videoMedia.videoWidth + 'x' + videoMedia.videoHeight);
        });

        // Fullscreen
        const webkitEnterFullscreen = (this[PlayerKey.MEDIA] as HTMLVideoElement).webkitEnterFullscreen;
        const IOS_FULLSCREEN = IS_IOS && webkitEnterFullscreen !== undefined;

        const toggleFullscreen = () => {
            if (containsClass(this[PlayerKey.CONTROLS], styles.playerFullscreen)) {
                screenfull.exit();
                this[PlayerKey.FOCUS]();
            } else {
                if (IOS_FULLSCREEN) {
                    webkitEnterFullscreen.call(this[PlayerKey.MEDIA]);
                } else {
                    screenfull.request(this[PlayerKey.CONTROLS]);
                }
                this[PlayerKey.FOCUS]();
            }
        };

        if ((screenfull.isEnabled || IOS_FULLSCREEN) && !IS_IOS_PWA) {
            addEventListener(this[PlayerKey.FULLSCREEN_BUTTON], 'click', toggleFullscreen);

            if (!IOS_FULLSCREEN) {
                this[PlayerKey.ON_FULLSCREEN_CHANGE] = () => {
                    const elemInFS = screenfull.element;
                    if (elemInFS === undefined) {
                        removeClass(this[PlayerKey.CONTROLS], styles.playerFullscreen);
                        this[PlayerKey.FULLSCREEN_BUTTON].title = 'Fullscreen';
                    } else if (elemInFS.isSameNode(this[PlayerKey.CONTROLS]) || elemInFS.isSameNode(this[PlayerKey.MEDIA])) {
                        addClass(this[PlayerKey.CONTROLS], styles.playerFullscreen);
                        this[PlayerKey.FULLSCREEN_BUTTON].title = 'Exit Fullscreen';
                    }
                };
                screenfull.on('change', this[PlayerKey.ON_FULLSCREEN_CHANGE]);
            }
        } else {
            disableButton(this[PlayerKey.FULLSCREEN_BUTTON], true);
            this[PlayerKey.FULLSCREEN_BUTTON].title = 'Fullscreen Unavailable';
        }

        // Picture in picture
        const PIPButton = this[PlayerKey.PIP_BUTTON];
        if (PIPButton !== undefined) {
            addEventListener(PIPButton, 'click', () => {
                if (containsClass(this[PlayerKey.CONTROLS], styles.playerPictureInPicture)) {
                    d.exitPictureInPicture();
                } else {
                    (this[PlayerKey.MEDIA] as HTMLVideoElement).requestPictureInPicture();
                }
                this[PlayerKey.FOCUS]();
            });

            addEventListener(this[PlayerKey.MEDIA], 'enterpictureinpicture', () => {
                addClass(this[PlayerKey.CONTROLS], styles.playerPictureInPicture);
                PIPButton.title = 'Exit Picture-in-Picture';
            });

            addEventListener(this[PlayerKey.MEDIA], 'leavepictureinpicture', () => {
                removeClass(this[PlayerKey.CONTROLS], styles.playerPictureInPicture);
                PIPButton.title = 'Picture-in-Picture';
                this[PlayerKey.FOCUS]();
            });
        }

        // Hotkeys
        addEventListener(this[PlayerKey.CONTROLS], 'keydown', (event) => {
            const key = (event as KeyboardEvent).key;
            if (key === ' ' || key === 'Spacebar') {
                this[PlayerKey.TOGGLE_PLAYBACK]();
                event.preventDefault();
            } else if (key === 'f' || key === 'F') {
                toggleFullscreen();
                event.preventDefault();
            } else if (key === 'ArrowLeft' || key === 'Left') {
                this[PlayerKey.SEEK](this[PlayerKey.MEDIA].currentTime - 5);
                event.preventDefault();
            } else if (key === 'ArrowRight' || key === 'Right') {
                this[PlayerKey.SEEK](this[PlayerKey.MEDIA].currentTime + 5);
                event.preventDefault();
            } else if (key === 'ArrowUp' || key === 'Up') {
                this[PlayerKey.SEEK](this[PlayerKey.MEDIA].currentTime + 15);
                event.preventDefault();
            } else if (key === 'ArrowDown' || key === 'Down') {
                this[PlayerKey.SEEK](this[PlayerKey.MEDIA].currentTime - 15);
                event.preventDefault();
            }
        });
    }

    private [PlayerKey.INTERVAL_CALLBACK](this: Player): void {
        const duration = this[PlayerKey.MEDIA].duration;
        if (!duration) {
            return;
        }
        if (this[PlayerKey.DRAGGING]) {
            if (this[PlayerKey.DRAGGING_PREVIEW_TIMEOUT] > 0 && this[PlayerKey.IS_VIDEO]) {
                this[PlayerKey.DRAGGING_PREVIEW_TIMEOUT]--;
            }
            return;
        }

        const currentTimestamp = toTimestampString(this[PlayerKey.MEDIA].currentTime, duration);
        if (this[PlayerKey.CURRENT_TIME_DISPLAY_TEXT].textContent !== currentTimestamp) {
            replaceText(this[PlayerKey.CURRENT_TIME_DISPLAY_TEXT], currentTimestamp);
        }
        setWidth(this[PlayerKey.PROGRESS_BAR], min(this[PlayerKey.MEDIA].currentTime / duration * 100, 100), CSS_UNIT.PERCENT);

        if (!this[PlayerKey.IS_VIDEO]) {
            return;
        }

        if (this[PlayerKey.INACTIVE_TIMEOUT] > 0) {
            this[PlayerKey.INACTIVE_TIMEOUT]--;
            if (this[PlayerKey.INACTIVE_TIMEOUT] === 0) {
                this[PlayerKey.ACTIVE] = false;
            }
        }

        if (ENABLE_DEBUG) {
            if (typeof (this[PlayerKey.MEDIA] as HTMLVideoElement).getVideoPlaybackQuality === 'function') {
                const quality = (this[PlayerKey.MEDIA] as HTMLVideoElement).getVideoPlaybackQuality();
                if (quality.droppedVideoFrames && quality.droppedVideoFrames !== this[PlayerKey.DROPPED_FRAMES]) {
                    this[PlayerKey.LOG]?.('Frame drop detected. Total dropped: ' + quality.droppedVideoFrames);
                    this[PlayerKey.DROPPED_FRAMES] = quality.droppedVideoFrames;
                }
                if (quality.corruptedVideoFrames && quality.corruptedVideoFrames !== this[PlayerKey.CORRUPTED_FRAMES]) {
                    this[PlayerKey.LOG]?.('Frame corruption detected. Total corrupted: ' + quality.corruptedVideoFrames);
                    this[PlayerKey.CORRUPTED_FRAMES] = quality.corruptedVideoFrames;
                }
            }
        }
    }

    protected [PlayerKey.ON_LOADED_METADATA](this: Player): void {
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Loaded metadata.');
        replaceText(this[PlayerKey.DURATION_DISPLAY_TEXT], toTimestampString(this[PlayerKey.MEDIA].duration));
        this[PlayerKey.ENDED] = false;
    }

    protected [PlayerKey.ON_DRAG_ENDED](this: Player, event: MouseEvent | TouchEvent): void {
        event.preventDefault(); // Prevent triggering mouse events after `touchend` on mobile devices.

        this[PlayerKey.DRAGGING] = false;
        this[PlayerKey.ACTIVE] = true; // The timeout won't decrease when this[PlayerKey.DRAGGING] == true.

        const currentTime = this[PlayerKey.PROGRESS_UPDATE](event);
        this[PlayerKey.SEEK](currentTime, () => {
            this[PlayerKey.MEDIA].playbackRate = 1;
        });
        this[PlayerKey.FOCUS]();
    }

    private [PlayerKey.PROGRESS_UPDATE](this: Player, event: MouseEvent | TouchEvent): number {
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
        const position = this[PlayerKey.PROGRESS_HOLDER].getBoundingClientRect();
        const totalLength = position.right - position.left;
        const leftPadding = min(max(mouseX - position.left, 0), totalLength);
        const percentage = leftPadding / totalLength;
        const duration = this[PlayerKey.MEDIA].duration;
        const currentTime = duration * percentage;
        const currentTimestamp = toTimestampString(currentTime, duration);

        if (!w.matchMedia('not screen and (hover: hover) and (pointer: fine)').matches) {
            setLeft(this[PlayerKey.PROGRESS_MOUSE_DISPLAY], leftPadding, CSS_UNIT.PX);
            replaceText(this[PlayerKey.TIME_TOOLTIP], currentTimestamp);
            setRight(this[PlayerKey.TIME_TOOLTIP], -this[PlayerKey.TIME_TOOLTIP].offsetWidth / 2, CSS_UNIT.PX);
            if (currentTime > this[PlayerKey.MEDIA].currentTime) {
                removeClass(this[PlayerKey.PROGRESS_MOUSE_DISPLAY], styles.playerMouseDisplayBackward);
                addClass(this[PlayerKey.PROGRESS_MOUSE_DISPLAY], styles.playerMouseDisplayForward);
            } else {
                removeClass(this[PlayerKey.PROGRESS_MOUSE_DISPLAY], styles.playerMouseDisplayForward);
                addClass(this[PlayerKey.PROGRESS_MOUSE_DISPLAY], styles.playerMouseDisplayBackward);
            }
        }
        if (this[PlayerKey.DRAGGING]) {
            if (this[PlayerKey.DRAGGING_PREVIEW_TIMEOUT] === 0) {
                this[PlayerKey.SEEK](currentTime, () => {
                    this[PlayerKey.DRAGGING_PREVIEW_TIMEOUT] = 4;
                });
            }
            replaceText(this[PlayerKey.CURRENT_TIME_DISPLAY_TEXT], currentTimestamp);
            setWidth(this[PlayerKey.PROGRESS_BAR], percentage * 100, CSS_UNIT.PERCENT);
        }
        return currentTime;
    }

    protected [PlayerKey.ON_PLAY](this: Player): void {
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Playback started at ' + this[PlayerKey.MEDIA].currentTime + '.');
        this[PlayerKey.PLAYING] = true;
    }

    private [PlayerKey.ON_PAUSE](this: Player): void {
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Playback paused at ' + this[PlayerKey.MEDIA].currentTime + '.');
        this[PlayerKey.PLAYING] = false;
        this[PlayerKey.ACTIVE] = true;
    }

    private [PlayerKey.ON_ENDED](this: Player): void {
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Playback ended.');
        if (!this[PlayerKey.DRAGGING]) {
            this[PlayerKey.ENDED] = true;
        }
    }

    protected [PlayerKey.ON_WAITING](this: Player): void {
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Playback entered waiting state at ' + this[PlayerKey.MEDIA].currentTime + '.');
        addClass(this[PlayerKey.CONTROLS], styles.playerSeeking);
    }

    protected [PlayerKey.ON_CAN_PLAY_THROUGH](this: Player): void {
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Playback can play through at ' + this[PlayerKey.MEDIA].currentTime + '.');
        removeClass(this[PlayerKey.CONTROLS], styles.playerSeeking);
    }

    protected [PlayerKey.ON_SEEKING](this: Player): void {
        ENABLE_DEBUG && this[PlayerKey.LOG]?.('Seeking: ' + this[PlayerKey.MEDIA].currentTime + '.');
    }

    protected [PlayerKey.GET_BUFFERED_RANGE](this: Player): { start: number; end: number }[] {
        const bufferedRange = [];
        let currentBuffer: null | { start: number; end: number } = null;
        for (let i = 0; i < this[PlayerKey.MEDIA].buffered.length; i++) {
            const nextBufferStart = this[PlayerKey.MEDIA].buffered.start(i);
            if (currentBuffer === null) {
                currentBuffer = { start: nextBufferStart, end: this[PlayerKey.MEDIA].buffered.end(i) };
            } else {
                if (nextBufferStart - this[PlayerKey.MAX_BUFFER_HOLE] <= currentBuffer.end) {
                    ENABLE_DEBUG && this[PlayerKey.LOG]?.('Buffer hole detected: ' + currentBuffer.end + '-' + nextBufferStart + '. Duration: ' + (nextBufferStart - currentBuffer.end));
                    currentBuffer.end = this[PlayerKey.MEDIA].buffered.end(i);
                } else {
                    bufferedRange.push(currentBuffer);
                    currentBuffer = { start: nextBufferStart, end: this[PlayerKey.MEDIA].buffered.end(i) };
                }
            }
        }
        currentBuffer && bufferedRange.push(currentBuffer);
        return bufferedRange;
    }

    public [PlayerKey.FOCUS](this: Player) {
        this[PlayerKey.CONTROLS].focus({ preventScroll: true });
    }

    private [PlayerKey.ON_WINDOW_RESIZE](this: Player) {
        let func = showElement;
        if (w.innerWidth < 320) {
            func = hideElement;
        }
        func(this[PlayerKey.CURRENT_TIME_DISPLAY]);
        func(this[PlayerKey.TIME_DIVIDER]);
        func(this[PlayerKey.DURATION_DISPLAY]);
    }

    private [PlayerKey.ON_MOUSE_UP](this: Player, event: Event) {
        if (this[PlayerKey.DRAGGING]) {
            this[PlayerKey.ON_DRAG_ENDED](event as MouseEvent | TouchEvent);
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
    const elem = createNativeButtonElement();
    elem.type = 'button';
    elem.title = title;
    return elem;
}
