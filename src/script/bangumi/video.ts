import { TOP_URL } from '../module/env/constant';
import {
    addEventListener,
    getById,
    addClass,
    getTitle,
    setClass,
    createTextNode,
    addEventsListener,
    appendChild,
    prependChild,
    insertBefore,
    getByIdNative,
    remove,
    showElement,
    hideElement,
    createParagraphElement,
    createDivElement,
    createSelectElement,
    createOptionElement,
    createSpanElement,
    appendText,
    replaceChildren,
    replaceText,
    removeAllEventListeners,
    getParentElement,
    removeClass,
    containsClass,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import type { VideoEPInfo, VideoFormatInfo } from '../module/type/BangumiInfo';

import {
    MSE,
    NATIVE_HLS,
    CAN_PLAY_AVC,
    videoCanPlay,
    audioCanPlay,
    IS_CHROMIUM,
    IS_FIREFOX,
    IS_EDGE,
    IS_WINDOWS,
    IS_IOS,
} from '../module/browser';
import type { Player, Player as PlayerType } from '../module/player/player';
import type { HlsPlayer as HlsPlayerType } from '../module/player/hls_player';

import { updateURLParam, getFormatIndex } from './helper';
import { showHLSCompatibilityError, showCodecCompatibilityError, buildDownloadAccordion, showMediaMessage, showErrorMessage, incompatibleTitle, incompatibleSuffix, showPlayerError, buildAccordion } from './media_helper';
import type { NativePlayerImportPromise, HlsPlayerImportPromise } from './get_import_promises';
import { encodeCFURIComponent, secToTimestamp } from '../module/common/pure';
import { HLS_BUFFER_APPEND_ERROR } from '../module/player/media_error';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid } from '../module/global';

let currentPgid: unknown;

let seriesID: string;
let epIndex: number;
let epInfo: VideoEPInfo;
let baseURL: string;
let nativePlayerImportPromise: NativePlayerImportPromise;
let hlsPlayerImportPromise: HlsPlayerImportPromise;
let createMediaSessionPromise: Promise<MediaSessionInfo>;

let currentFormat: VideoFormatInfo;
let currentMediaInstance: PlayerType | null = null;

const eventTargetsTracker = new Set<EventTarget>();

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: VideoEPInfo,
    _baseURL: string,
    _nativePlayerImportPromise: NativePlayerImportPromise,
    _hlsPlayerImportPromise: HlsPlayerImportPromise,
    _createMediaSessionPromise: Promise<MediaSessionInfo>,
    startTime: number | null,
    play: boolean
) {
    currentPgid = pgid;

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    nativePlayerImportPromise = _nativePlayerImportPromise;
    hlsPlayerImportPromise = _hlsPlayerImportPromise;
    createMediaSessionPromise = _createMediaSessionPromise;

    const mediaHolder = getById('media-holder');
    const contentContainer = getById('content');
    addClass(contentContainer, 'video');

    // Title
    if (epInfo.title != '') {
        const title = createParagraphElement();
        addClass(title, 'sub-title');
        addClass(title, 'center-align');
        title.innerHTML = epInfo.title; // This title is in HTML syntax.
        prependChild(contentContainer, title);
    }

    // Formats
    let formatIndex = getFormatIndex();
    const formats = epInfo.formats;

    const formatContainer = createDivElement();
    formatContainer.id = 'format-container';
    const formatSelector = createDivElement();
    formatSelector.id = 'format-selector';
    addClass(formatSelector, 'select');

    const selectMenu = createSelectElement();

    if (formatIndex >= formats.length) {
        formatIndex = 0;
    }
    updateURLParam(seriesID, epIndex, formatIndex);

    formats.forEach((format, index) => {
        const option = createOptionElement();

        option.value = format.value;
        appendText(option, (format.tag === undefined) ? format.value : format.tag);

        if (index == formatIndex) {
            option.selected = true;
            currentFormat = format;
        }

        appendChild(selectMenu, option);
    });

    appendChild(formatSelector, selectMenu);
    disableDropdown(selectMenu, true);
    appendChild(formatContainer, formatSelector);

    const formatDisplay = createDivElement();
    formatDisplay.id = 'format-display';
    hideElement(formatDisplay);
    appendChild(formatContainer, formatDisplay);

    insertBefore(formatContainer, mediaHolder);

    createMediaSessionPromise.then((mediaSessionInfo) => {
        if (currentPgid !== pgid) {
            return;
        }
        const [downloadAccordion, containerSelector] = buildDownloadAccordion(mediaSessionInfo.credential, seriesID, epIndex, { selectMenu: selectMenu, formats: formats, initialFormat: currentFormat });
        appendChild(contentContainer, downloadAccordion);
        addEventListener(selectMenu, 'change', () => { formatSwitch(mediaHolder, selectMenu, containerSelector); });
    });

    addVideoNode(
        mediaHolder,
        {
            startTime: startTime === null ? undefined : startTime,
            play: play
        }
    ).then(() => {
        disableDropdown(selectMenu, false);
    });
}

function formatSwitch(mediaHolder: HTMLElement, formatSelectMenu: HTMLSelectElement, containerSelector: HTMLElement) {
    disableDropdown(formatSelectMenu, true);
    const formatIndex = formatSelectMenu.selectedIndex;

    const format = epInfo.formats[formatIndex];
    if (format === undefined) {
        return;
    }
    currentFormat = format;
    updateURLParam(seriesID, epIndex, formatIndex);

    if (format.direct_download) {
        hideElement(containerSelector);
    } else {
        showElement(containerSelector);
    }

    let config: {
        play?: boolean | undefined;
        startTime?: number | undefined;
    } | undefined;

    const mediaInstance = currentMediaInstance;
    if (mediaInstance !== null) {
        config = {
            play: mediaInstance.playing,
            startTime: mediaInstance.media.currentTime
        };
    }

    addVideoNode(mediaHolder, config).then(() => {
        if (mediaInstance === currentMediaInstance && mediaInstance !== null) {
            mediaInstance.destroy();
            currentMediaInstance = null;
            cleanupEvents();
        }
        if (currentMediaInstance === null) {
            hideElement(getById('format-display'));
        }
        disableDropdown(formatSelectMenu, false);
    });
}

async function addVideoNode(mediaHolder: HTMLElement, config?: {
    play?: boolean | undefined;
    startTime?: number | undefined;
}) {
    if (!MSE && !NATIVE_HLS) {
        showHLSCompatibilityError();
        return;
    }

    let formatString = '';
    const mediaMessageQueue: [string, string, string | null][] = [];

    let USE_NATIVE_HLS = NATIVE_HLS;
    let USE_AVC = true;
    let AVC_FALLBACK = false;

    if (currentFormat.video === 'dv5') {
        USE_NATIVE_HLS = USE_NATIVE_HLS && IS_IOS;
        if (!videoCanPlay('dvh1.05.06', USE_NATIVE_HLS)) {
            showDolbyVisionError();
            return;
        }
        formatString = 'HEVC/Main 10/L5.1/High/dvhe.05.06';
        USE_AVC = false;
    } else if (currentFormat.video === 'hdr10') {
        USE_NATIVE_HLS = USE_NATIVE_HLS && IS_IOS;
        if (!videoCanPlay('hvc1.2.4.H153.90', USE_NATIVE_HLS)) {
            showErrorMessage(incompatibleTitle, `お使いのブラウザは、再生に必要なコーデックに対応していません。詳しくは<a class="link" href="${TOP_URL}/news/UFzUoubmOzd" target="_blank">こちら</a>をご覧ください。`);
            return;
        }
        formatString = 'HEVC/Main 10/L5.1/High';
        USE_AVC = false;
        mediaMessageQueue.push(['HDR10について', `詳しくは<a class="link" href="${TOP_URL}/news/0p7hzGpxfMh" target="_blank">こちら</a>をご覧ください。`, null]);
    } else if (currentFormat.video === 'hevc41') {
        const CAN_PLAY_HEVC = await canPlayHEVC(USE_NATIVE_HLS, currentFormat.avc_fallback);
        if (currentPgid !== pgid) {
            return;
        }
        if (CAN_PLAY_HEVC) {
            formatString = 'HEVC/Main 10/L4.1/High';
            USE_AVC = false;
        } else if (currentFormat.avc_fallback) {
            AVC_FALLBACK = true;
        } else {
            showCodecCompatibilityError();
            return;
        }
    }

    if (USE_AVC) {
        if (CAN_PLAY_AVC) { // This constant can be used since USE_NATIVE_HLS === NATIVE_HLS in any case USE_AVC is true.
            formatString = 'AVC/High/L5';
        } else {
            showCodecCompatibilityError();
            return;
        }
    }


    let AAC_FALLBACK = false;
    let USE_AAC = false;
    if (currentFormat.audio !== 'none') {
        USE_AAC = true;

        if (currentFormat.audio !== undefined) {
            if (currentFormat.audio.startsWith('atmos')) {
                mediaMessageQueue.push(['Dolby Atmos®について', `Dolby® TrueHDコアトラックとAC-3ダウンミックストラックのみを提供しています。詳しくは<a class="link" href="${TOP_URL}/news/yMq2BLvq-8Yq" target="_blank">こちら</a>をご覧ください。`, null]);
            }

            if (currentFormat.audio.startsWith('atmos_ac3')) {
                if (audioCanPlay('ac-3', USE_NATIVE_HLS)) {
                    formatString += ' + AC-3';
                    USE_AAC = false;
                } else if (currentFormat.aac_fallback) {
                    AAC_FALLBACK = true;
                } else {
                    showCodecCompatibilityError();
                    return;
                }
            }
        }

        if (USE_AAC) {
            if (audioCanPlay('mp4a.40.2', USE_NATIVE_HLS)) {
                formatString += ' + AAC LC';
            } else {
                showCodecCompatibilityError();
                return;
            }
        }
    }

    const formatDisplay = getById('format-display');
    replaceText(formatDisplay, formatString);
    showElement(formatDisplay);

    const _config = config ?? {};

    const playerContainer = createDivElement();
    playerContainer.style.paddingTop = 9 / 16 * 100 + '%';

    let chaptersActive = true;
    const beforeLoad = () => {
        const chaptersAccordion = getByIdNative('chapters-accordion');
        if (chaptersAccordion !== null) {
            chaptersActive = containsClass(chaptersAccordion, 'active');
        }
        if (currentMediaInstance !== null) {
            currentMediaInstance.destroy();
            currentMediaInstance = null;
            cleanupEvents();
        }
        replaceChildren(mediaHolder, playerContainer);
        for (const mediaMessage of mediaMessageQueue) {
            showMediaMessage(...mediaMessage);
        }
        showElement(mediaHolder);
        const errorMsgElem = getByIdNative('error');
        errorMsgElem && remove(errorMsgElem);
    };
    const afterLoad = (mediaInstance: PlayerType) => {
        mediaInstance.media.title = getTitle();
        if (epInfo.chapters.length > 0) {
            displayChapters(mediaHolder, mediaInstance, USE_AAC ? 44 : 0, chaptersActive);
        }
    };

    const url = baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + currentFormat.value + ']' + (AVC_FALLBACK ? '[AVC]' : '') + (AAC_FALLBACK ? '[AAC]' : '') + '.m3u8');
    if (USE_NATIVE_HLS) {
        let Player: typeof PlayerType;
        try {
            await createMediaSessionPromise;
            Player = (await nativePlayerImportPromise).Player;
        } catch (e) {
            if (currentPgid === pgid) {
                showMessage(moduleImportError(e));
            }
            throw e;
        }

        if (currentPgid !== pgid) {
            return;
        }

        const mediaInstance = new Player(playerContainer);
        beforeLoad();
        currentMediaInstance = mediaInstance;
        mediaInstance.load(url, {
            onerror: function (errorCode: number | null) {
                showPlayerError(errorCode);
                currentMediaInstance = null;
                mediaInstance.destroy();
                cleanupEvents();
            },
            play: _config.play,
            startTime: _config.startTime
        });
        afterLoad(mediaInstance);
    } else {
        let HlsPlayer: typeof HlsPlayerType;
        try {
            await createMediaSessionPromise;
            HlsPlayer = (await hlsPlayerImportPromise).HlsPlayer;
        } catch (e) {
            if (currentPgid === pgid) {
                showMessage(moduleImportError(e));
            }
            throw e;
        }

        if (currentPgid !== pgid) {
            return;
        }

        const hlsConfig = {
            enableWebVTT: false,
            enableIMSC1: false,
            enableCEA708Captions: false,
            lowLatencyMode: false,
            enableWorker: false,
            maxFragLookUpTolerance: 0.0,
            backBufferLength: 0,
            maxBufferLength: 16, // (100 * 8 * 1000 - 168750) / 20000 - 15
            maxBufferSize: 0, // (100 - (20 * 15 + 168.75) / 8) * 1000 * 1000 (This buffer size will be exceeded sometimes)
            maxBufferHole: 0.5, // In Safari 12, without this option video will stall at the start. Default: 0.1.
            debug: DEVELOPMENT,
            xhrSetup: function (xhr: XMLHttpRequest) {
                xhr.withCredentials = true;
            }
        };

        const mediaInstance = new HlsPlayer(playerContainer, hlsConfig);
        beforeLoad();
        currentMediaInstance = mediaInstance;
        mediaInstance.load(url, {
            onerror: function (errorCode: number | null) {
                if (errorCode === HLS_BUFFER_APPEND_ERROR) {
                    if (currentFormat.video === 'dv5') {
                        showDolbyVisionError();
                    } else if (currentFormat.audio === 'atmos_aac_8ch' && (IS_CHROMIUM || IS_FIREFOX)) {
                        show8chAudioError();
                    } else {
                        showPlayerError(errorCode);
                    }
                } else {
                    showPlayerError(errorCode);
                }
                currentMediaInstance = null;
                mediaInstance.destroy();
                cleanupEvents();
            },
            play: _config.play,
            startTime: _config.startTime
        });
        afterLoad(mediaInstance);
    }
}

function displayChapters(mediaHolder: HTMLElement, mediaInstance: Player, offset: number, active: boolean) {
    const [accordion, accordionPanel] = buildAccordion('チャプター', active);
    accordion.id = 'chapters-accordion';
    eventTargetsTracker.add(accordion);

    const chapterElements: HTMLParagraphElement[] = [];
    for (const chapter of epInfo.chapters) {
        const chapterNode = createParagraphElement();
        const timestamp = createSpanElement();
        const cueText = createTextNode('\xa0\xa0' + chapter[0]);
        const startTime = (chapter[1] + offset) / 1000;
        appendText(timestamp, secToTimestamp(startTime));
        addEventListener(timestamp, 'click', () => {
            mediaInstance.seek(startTime);
            mediaInstance.focus();
        });
        eventTargetsTracker.add(timestamp);
        appendChild(chapterNode, timestamp);
        appendChild(chapterNode, cueText);
        setClass(chapterNode, 'inactive-chapter');
        appendChild(accordionPanel, chapterNode);
        chapterElements.push(chapterNode);
    }

    const chaptersNode = createDivElement();
    addClass(chaptersNode, 'chapters');
    appendChild(chaptersNode, accordion);
    appendChild(chaptersNode, accordionPanel);
    appendChild(mediaHolder, chaptersNode);

    const video = mediaInstance.media;
    function updateChapterDisplay() {
        const currentTime = video.currentTime;
        epInfo.chapters.forEach((chapter, index) => {
            const chapterElement = chapterElements[index] as HTMLElement;
            if (currentTime >= (chapter[1] + offset) / 1000) {
                const nextChapter = epInfo.chapters[index + 1];
                if (nextChapter === undefined) {
                    setClass(chapterElement, 'current-chapter');
                } else if (currentTime < (nextChapter[1] + offset) / 1000) {
                    setClass(chapterElement, 'current-chapter');
                } else {
                    setClass(chapterElement, 'inactive-chapter');
                }
            } else {
                setClass(chapterElement, 'inactive-chapter');
            }
        });
    }
    addEventsListener(video, ['play', 'pause', 'seeking', 'seeked', 'timeupdate'], updateChapterDisplay);
}

function showDolbyVisionError() {
    showErrorMessage('Dolby Vision®に対応していません', `Dolby Vision®を再生できるブラウザは、Safariのみです。詳しくは<a class="link" href="${TOP_URL}/news/0p7hzGpxfMh" target="_blank">こちら</a>をご覧ください。`);
}

function show8chAudioError() {
    showErrorMessage(incompatibleTitle, 'ChromiumベースのブラウザとFirefoxでは、7.1chオーディオを再生することはできません。' + incompatibleSuffix);
}

async function canPlayHEVC(native: boolean, withFallback: boolean | undefined): Promise<boolean> {
    const HEVC41_CODEC = 'hvc1.2.4.H123.90';
    if ((IS_WINDOWS && IS_EDGE) || !videoCanPlay(HEVC41_CODEC, native)) {
        return false;
    }
    if (!withFallback) {
        return true;
    }
    if (!navigator.mediaCapabilities) {
        return false;
    }

    let decodingInfo: MediaCapabilitiesDecodingInfo;
    try {
        decodingInfo = await navigator.mediaCapabilities.decodingInfo({
            type: native ? 'file' : 'media-source',
            video: {
                contentType: `video/mp4;codecs=${HEVC41_CODEC}`,
                width: 1920,
                height: 1080,
                bitrate: 24000 * 1000,
                framerate: 60,
            },
        });
    } catch {
        return false;
    }

    return decodingInfo.supported && decodingInfo.powerEfficient;
}

function disableDropdown(selectElement: HTMLSelectElement, disabled: boolean) {
    selectElement.disabled = disabled;
    if (disabled) {
        addClass(getParentElement(selectElement), 'disabled');
    } else {
        removeClass(getParentElement(selectElement), 'disabled');
    }
}

function cleanupEvents() {
    for (const eventTarget of eventTargetsTracker) {
        removeAllEventListeners(eventTarget);
    }
    eventTargetsTracker.clear();
}

export function offload() {
    currentMediaInstance?.destroy();
    currentMediaInstance = null;
    eventTargetsTracker.clear();
}