import { TOP_URL } from '../module/env/constant';
import {
    addEventListener,
    addClass,
    getTitle,
    setClass,
    createTextNode,
    addEventsListener,
    appendChild,
    prependChild,
    insertBefore,
    remove,
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
    changeURL,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
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
import { showHLSCompatibilityError, showCodecCompatibilityError, buildDownloadAccordion, showMediaMessage, showErrorMessage, incompatibleTitle, incompatibleSuffix, showPlayerError, buildAccordion, showTextErrorMessage, type AccordionInstance } from './media_helper';
import { encodeCFURIComponent, secToTimestamp } from '../module/common/pure';
import { CustomMediaError } from '../module/player/media_error';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid, redirect } from '../module/global';
import { hlsPlayerImportPromise, nativePlayerImportPromise } from './import_promise';
import { SharedElementVarsIdx, errorMessageElement, getSharedElement } from './shared_var';
import { addInterval, removeInterval } from '../module/timer';
import { hideElement, setPaddingTop, showElement } from '../module/style';
import { CSS_COLOR, CSS_UNIT } from '../module/style/value';
import { getURLParam } from '../module/common';
import * as commonStyles from '../../css/common.module.scss';
import * as styles from '../../css/bangumi.module.scss';

let currentPgid: unknown;

let seriesID: string;
let epIndex: number;
let epInfo: VideoEPInfo;
let baseURL: string;
let createMediaSessionPromise: Promise<MediaSessionInfo>;

let currentFormat: VideoFormatInfo;
let currentMediaInstance: PlayerType | null = null;
let chaptersAccordionInstance: AccordionInstance | null = null;

const eventTargetsTracker = new Set<EventTarget>();
const timersTracker = new Set<ReturnType<typeof setInterval>>();

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: VideoEPInfo,
    _baseURL: string,
    _createMediaSessionPromise: Promise<MediaSessionInfo>,
) {
    currentPgid = pgid;

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    createMediaSessionPromise = _createMediaSessionPromise;

    const contentContainer = getSharedElement(SharedElementVarsIdx.CONTENT_CONTAINER);
    addClass(contentContainer, styles.video);

    const startTimeText = getURLParam('timestamp');
    let startTime: number | undefined = undefined;
    if (startTimeText !== null) {
        startTime = parseFloat(startTimeText);
        if (isNaN(startTime)) {
            startTime = undefined;
        }
    }
    const play = getURLParam('play') === '1';

    // Title
    if (epInfo.title !== '') {
        const title = createParagraphElement();
        addClass(title, styles.subTitle, styles.centerAlign);
        title.innerHTML = epInfo.title; // This title is in HTML syntax.
        prependChild(contentContainer, title);
    }

    // Formats
    let formatIndex = getFormatIndex();
    const formats = epInfo.formats;

    const formatContainer = createDivElement();
    addClass(formatContainer, styles.formatContainer);
    const formatSelector = createDivElement();
    addClass(formatSelector, styles.select);

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
    addClass(formatDisplay, styles.formatDisplay);
    hideElement(formatDisplay);
    appendChild(formatContainer, formatDisplay);

    insertBefore(formatContainer, getSharedElement(SharedElementVarsIdx.MEDIA_HOLDER));

    createMediaSessionPromise.then((mediaSessionInfo) => {
        if (currentPgid !== pgid) {
            return;
        }
        const [downloadAccordion, containerSelector] = buildDownloadAccordion(mediaSessionInfo.credential, seriesID, epIndex, { selectMenu: selectMenu, formats: formats, initialFormat: currentFormat });
        appendChild(contentContainer, downloadAccordion);
        addEventListener(selectMenu, 'change', () => { formatSwitch(selectMenu, formatDisplay, containerSelector); });
    });

    addVideoNode(formatDisplay, play, startTime).then(() => {
        disableDropdown(selectMenu, false);
    });
}

function formatSwitch(formatSelectMenu: HTMLSelectElement, formatDisplay: HTMLDivElement, containerSelector: HTMLElement) {
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

    let startTime: number | undefined = undefined;
    let play: boolean | undefined = undefined;
    const mediaInstance = currentMediaInstance;
    if (mediaInstance !== null) {
        play = mediaInstance.playing;
        startTime = mediaInstance.media.currentTime;
    }

    addVideoNode(formatDisplay, play, startTime).then(() => {
        if (mediaInstance === currentMediaInstance) {
            destroyMediaInstance();
        }
        if (currentMediaInstance === null) {
            hideElement(formatDisplay);
        }
        disableDropdown(formatSelectMenu, false);
    });
}

async function addVideoNode(formatDisplay: HTMLDivElement, play: boolean | undefined, startTime: number | undefined) {
    if (!MSE_SUPPORTED && !NATIVE_HLS_SUPPORTED) {
        showHLSCompatibilityError();
        return;
    }

    let formatString = '';
    const mediaMessageQueue: [string, Node[], CSS_COLOR | null][] = [];

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

    replaceText(formatDisplay, formatString);
    showElement(formatDisplay);

    const playerContainer = createDivElement();
    addClass(playerContainer, styles.player);
    setPaddingTop(playerContainer, 9 / 16 * 100, CSS_UNIT.PERCENT);

    let chaptersActive = true;
    const beforeLoad = () => {
        if (chaptersAccordionInstance !== null) {
            chaptersActive = chaptersAccordionInstance[2];
        }
        if (currentMediaInstance !== null) {
            destroyMediaInstance();
        }
        const mediaHolder = getSharedElement(SharedElementVarsIdx.MEDIA_HOLDER);
        replaceChildren(mediaHolder, playerContainer);
        for (const mediaMessage of mediaMessageQueue) {
            showMediaMessage(...mediaMessage);
        }
        showElement(mediaHolder);
        const errorMsgElem = errorMessageElement;
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
                destroyMediaInstance();
            },
            play: play,
            startTime: startTime
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
                    CSS_COLOR.ORANGE
                );
            }
        };
        mediaInstance.load(url, {
            onerror: function (errorCode: number | null) {
                if (errorCode === CustomMediaError.HLS_BUFFER_APPEND_ERROR) {
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
                destroyMediaInstance();
            },
            play: play,
            startTime: startTime
        });
        afterLoad(mediaInstance);
    }
}

function displayChapters(mediaInstance: Player, offset: number, active: boolean) {
    const accordionInstance = buildAccordion('チャプター', active);
    chaptersAccordionInstance = accordionInstance;
    const [accordion, accordionPanel] = accordionInstance;
    eventTargetsTracker.add(accordion);

    const chapterElements: HTMLParagraphElement[] = [];
    for (const chapter of epInfo.chapters) {
        const chapterNode = createParagraphElement();
        const cueText = createTextNode('\xa0\xa0' + chapter[0]);
        const startTime = (chapter[1] + offset) / 1000;
        const timestamp = createSpanElement(secToTimestamp(startTime));
        addEventListener(timestamp, 'click', () => {
            mediaInstance.seek(startTime);
            mediaInstance.focus();
        });
        eventTargetsTracker.add(timestamp);
        appendChild(chapterNode, timestamp);
        appendChild(chapterNode, cueText);
        setClass(chapterNode, styles.inactiveChapter);
        appendChild(accordionPanel, chapterNode);
        chapterElements.push(chapterNode);
    }

    const chaptersNode = createDivElement();
    addClass(chaptersNode, styles.chapters);
    appendChild(chaptersNode, accordion);
    appendChild(chaptersNode, accordionPanel);
    appendChild(getSharedElement(SharedElementVarsIdx.MEDIA_HOLDER), chaptersNode);

    const video = mediaInstance.media;
    function updateChapterDisplay() {
        const currentTime = video.currentTime;
        epInfo.chapters.forEach((chapter, index) => {
            const chapterElement = chapterElements[index] as HTMLElement;
            if (currentTime >= (chapter[1] + offset) / 1000) {
                const nextChapter = epInfo.chapters[index + 1];
                if (nextChapter === undefined) {
                    setClass(chapterElement, styles.currentChapter);
                } else if (currentTime < (nextChapter[1] + offset) / 1000) {
                    setClass(chapterElement, styles.currentChapter);
                } else {
                    setClass(chapterElement, styles.inactiveChapter);
                }
            } else {
                setClass(chapterElement, styles.inactiveChapter);
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
    const linkElem = createSpanElement(text);
    addClass(linkElem, commonStyles.link);
    addEventListener(linkElem, 'click', () => {
        redirect(link);
    });
    return linkElem;
}

function disableDropdown(selectElement: HTMLSelectElement, disabled: boolean) {
    selectElement.disabled = disabled;
    if (disabled) {
        addClass(getParentElement(selectElement), styles.disabled);
    } else {
        removeClass(getParentElement(selectElement), styles.disabled);
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

function destroyMediaInstance() {
    currentMediaInstance?.destroy();
    currentMediaInstance = null;
    cleanupEvents();
    chaptersAccordionInstance = null;
}

export function offload() {
    destroyMediaInstance();
}