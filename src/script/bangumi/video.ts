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
    changeURL,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import type { VideoEPInfo, VideoFormatInfo } from '../module/type/BangumiInfo';

import {
    MSE_SUPPORTED,
    NATIVE_HLS_SUPPORTED,
    CAN_PLAY_AVC,
    videoCanPlay,
    audioCanPlay,
    IS_CHROMIUM,
    IS_FIREFOX,
    CAN_PLAY_AAC,
    MSE_BUFFER_SIZE,
    MIN_MSE_BUFFER_SIZE,
} from '../module/browser';
import type { Player, Player as PlayerType } from '../module/player/player';
import type { HlsPlayer as HlsPlayerType } from '../module/player/hls_player';

import { getFormatIndex, createQuery } from './helper';
import { showHLSCompatibilityError, showCodecCompatibilityError, buildDownloadAccordion, showMediaMessage, showErrorMessage, incompatibleTitle, incompatibleSuffix, showPlayerError, buildAccordion, showTextErrorMessage } from './media_helper';
import { encodeCFURIComponent, secToTimestamp } from '../module/common/pure';
import { HLS_BUFFER_APPEND_ERROR } from '../module/player/media_error';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid, redirect } from '../module/global';
import { hlsPlayerImportPromise, nativePlayerImportPromise } from './import_promise';
import { SHARED_VAR_IDX_CONTENT_CONTAINER, SHARED_VAR_IDX_MEDIA_HOLDER, getSharedElement } from './shared_var';
import { addInterval, removeInterval } from '../module/timer';

let currentPgid: unknown;

let seriesID: string;
let epIndex: number;
let epInfo: VideoEPInfo;
let baseURL: string;
let createMediaSessionPromise: Promise<MediaSessionInfo>;

let currentFormat: VideoFormatInfo;
let currentMediaInstance: PlayerType | null = null;

const eventTargetsTracker = new Set<EventTarget>();
const timersTracker = new Set<ReturnType<typeof setInterval>>();

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: VideoEPInfo,
    _baseURL: string,
    _createMediaSessionPromise: Promise<MediaSessionInfo>,
    startTime: number | null,
    play: boolean
) {
    currentPgid = pgid;

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    createMediaSessionPromise = _createMediaSessionPromise;

    const contentContainer = getSharedElement(SHARED_VAR_IDX_CONTENT_CONTAINER);

    addClass(contentContainer, 'video');

    // Title
    if (epInfo.title !== '') {
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

    formats.forEach((format, index) => {
        const option = createOptionElement();

        option.value = format.value;
        appendText(option, (format.tag === undefined) ? format.value : format.tag);

        if (index === formatIndex) {
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

    insertBefore(formatContainer, getSharedElement(SHARED_VAR_IDX_MEDIA_HOLDER));

    createMediaSessionPromise.then((mediaSessionInfo) => {
        if (currentPgid !== pgid) {
            return;
        }
        const [downloadAccordion, containerSelector] = buildDownloadAccordion(mediaSessionInfo.credential, seriesID, epIndex, { selectMenu: selectMenu, formats: formats, initialFormat: currentFormat });
        appendChild(contentContainer, downloadAccordion);
        addEventListener(selectMenu, 'change', () => { formatSwitch(selectMenu, containerSelector); });
    });

    addVideoNode({
        startTime: startTime === null ? undefined : startTime,
        play: play
    }).then(() => {
        disableDropdown(selectMenu, false);
    });
}

function formatSwitch(formatSelectMenu: HTMLSelectElement, containerSelector: HTMLElement) {
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

    addVideoNode(config).then(() => {
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

async function addVideoNode(config?: {
    play?: boolean | undefined;
    startTime?: number | undefined;
}) {
    if (!MSE_SUPPORTED && !NATIVE_HLS_SUPPORTED) {
        showHLSCompatibilityError();
        return;
    }

    let formatString = '';
    const mediaMessageQueue: [string, Node[], string | null][] = [];

    let USE_AVC = true;
    let AVC_FALLBACK = false;

    if (currentFormat.video === 'dv5') {
        if (!videoCanPlay('dvh1.05.06')) {
            showDolbyVisionError();
            return;
        }
        formatString = 'HEVC/Main 10/L5.1/High/dvhe.05.06';
        USE_AVC = false;
    } else if (currentFormat.video === 'hdr10') {
        if (!videoCanPlay('hvc1.2.4.H153.90')) {
            showErrorMessage(incompatibleTitle, [
                createTextNode('お使いのブラウザは、再生に必要なコーデックに対応していません。詳しくは'),
                createLinkElem('こちら', TOP_URL + '/news/UFzUoubmOzd'),
                createTextNode('をご覧ください。')
            ]);
            return;
        }
        formatString = 'HEVC/Main 10/L5.1/High';
        USE_AVC = false;
        mediaMessageQueue.push(['HDR10について', [
            createTextNode('詳しくは'),
            createLinkElem('こちら', TOP_URL + '/news/0p7hzGpxfMh'),
            createTextNode('をご覧ください。')
        ], null]);
    } else if (currentFormat.video === 'hevc41') {
        const CAN_PLAY_HEVC = await canPlayHEVC(currentFormat.avc_fallback);
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
        if (CAN_PLAY_AVC) {
            formatString = 'AVC/High/L5';
        } else {
            showCodecCompatibilityError();
            return;
        }
    }


    let AAC_FALLBACK = false;
    let USE_AAC = false;
    let audioOffset = 0;
    if (currentFormat.audio !== 'none') {
        USE_AAC = true;

        if (currentFormat.audio !== undefined) {
            if (currentFormat.audio.startsWith('atmos')) {
                mediaMessageQueue.push(['Dolby Atmos®について', [
                    createTextNode('Dolby® TrueHDコアトラックとAC-3ダウンミックストラックのみを提供しています。詳しくは'),
                    createLinkElem('こちら', TOP_URL + '/news/yMq2BLvq-8Yq'),
                    createTextNode('をご覧ください。')
                ], null]);
            }

            if (currentFormat.audio.startsWith('atmos_ac3')) {
                if (audioCanPlay('ac-3')) {
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
            if (CAN_PLAY_AAC) {
                formatString += ' + AAC LC';
            } else {
                showCodecCompatibilityError();
                return;
            }
            if (currentFormat.audio !== 'raw_aac_lc') {
                audioOffset = 44;
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
        const mediaHolder = getSharedElement(SHARED_VAR_IDX_MEDIA_HOLDER);
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
            displayChapters(mediaInstance, audioOffset, chaptersActive);
        }
    };

    const url = baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + currentFormat.value + ']' + (AVC_FALLBACK ? '[AVC]' : '') + (AAC_FALLBACK ? '[AAC]' : '') + '.m3u8');
    if (!MSE_SUPPORTED) {
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

        const mediaInstance = new Player(playerContainer, true);
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

        const maxBufferLength = (MSE_BUFFER_SIZE * 8 * 1024 - 168750) / 20000 - 15;
        const minBufferLength = (MIN_MSE_BUFFER_SIZE * 8 * 1024 - 168750) / 20000 - 15;
        const hlsConfig = {
            maxBufferLength: maxBufferLength,
            maxMaxBufferLength: maxBufferLength,
            mmsMinBufferLength: minBufferLength,
            minMaxBufferLength: minBufferLength,
        };

        const mediaInstance = new HlsPlayer(playerContainer, hlsConfig, true);
        let bufferStalledMessageShown = false;
        beforeLoad();
        currentMediaInstance = mediaInstance;
        mediaInstance.onbufferstalled = () => {
            if (!bufferStalledMessageShown) {
                bufferStalledMessageShown = true;
                showMediaMessage(
                    '再生中に問題が発生した可能性があります',
                    [createTextNode('バッファリングに通常より時間がかかっています。遅いネットワークが原因かもしれません。または、デバイスのメモリが不足しています。このような場合、動画がスムーズに再生されるかどうかは保証できません。')],
                    'orange'
                );
            }
        };
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

function displayChapters(mediaInstance: Player, offset: number, active: boolean) {
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
    appendChild(getSharedElement(SHARED_VAR_IDX_MEDIA_HOLDER), chaptersNode);

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
    addEventsListener(video, ['play', 'pause', 'seeking', 'seeked'], updateChapterDisplay);
    const timer = addInterval(updateChapterDisplay, 500);
    timersTracker.add(timer);
}

function showDolbyVisionError() {
    showErrorMessage('Dolby Vision®に対応していません', [
        createTextNode('Dolby Vision®を再生できるブラウザは、Safariのみです。詳しくは'),
        createLinkElem('こちら', TOP_URL + '/news/0p7hzGpxfMh'),
        createTextNode('をご覧ください。')
    ]);
}

function show8chAudioError() {
    showTextErrorMessage(incompatibleTitle, 'ChromiumベースのブラウザとFirefoxでは、7.1chオーディオを再生することはできません。' + incompatibleSuffix);
}

async function canPlayHEVC(withFallback: boolean | undefined): Promise<boolean> {
    const HEVC41_CODEC = 'hvc1.2.4.H123.90';
    if (!videoCanPlay(HEVC41_CODEC)) {
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
            type: MSE_SUPPORTED ? 'media-source' : 'file',
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

function createLinkElem(text: string, link: string) {
    const linkElem = createSpanElement();
    addClass(linkElem, 'link');
    appendText(linkElem, text);
    addEventListener(linkElem, 'click', () => {
        redirect(link);
    });
    return linkElem;
}

function disableDropdown(selectElement: HTMLSelectElement, disabled: boolean) {
    selectElement.disabled = disabled;
    if (disabled) {
        addClass(getParentElement(selectElement), 'disabled');
    } else {
        removeClass(getParentElement(selectElement), 'disabled');
    }
}

function updateURLParam(seriesID: string, epIndex: number, formatIndex: number): void {
    let url = TOP_URL + '/bangumi/' + seriesID;

    const query = createQuery(epIndex, formatIndex);
    if (query !== '') {
        url += '?' + query;
    }

    changeURL(url, true);
}

function cleanupEvents() {
    for (const eventTarget of eventTargetsTracker) {
        removeAllEventListeners(eventTarget);
    }
    eventTargetsTracker.clear();
    for (const timer of timersTracker) {
        removeInterval(timer);
    }
    timersTracker.clear();
}

export function offload() {
    currentMediaInstance?.destroy();
    currentMediaInstance = null;
    eventTargetsTracker.clear();
    timersTracker.clear();
}