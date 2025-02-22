import { prependChild } from '../module/dom/node/prepend_child';
import { insertBefore } from '../module/dom/node/insert_before';
import { remove } from '../module/dom/node/remove';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { removeClass } from '../module/dom/class/remove';
import { setClass } from '../module/dom/class/set';
import { replaceText } from '../module/dom/element/text/replace';
import { appendText } from '../module/dom/element/text/append';
import { createTextNode } from '../module/dom/element/text/create';
import { createOptionElement } from '../module/dom/element/option/create';
import { createSelectElement } from '../module/dom/element/select/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { getTitle } from '../module/dom/document/title';
import { getSearchParam } from '../module/dom/location/get/search_param';
import { setHistoryState } from '../module/dom/location/set/history_state';
import { removeAllEventListeners } from '../module/event_listener/remove/all_listeners';
import { addEventsListener } from '../module/event_listener/add/multiple_events';
import { addEventListener } from '../module/event_listener/add';
import { FileInfoKey, VideoFormatKey, type VideoFileInfo, type VideoFormat } from '../module/type/EPInfo';
import { MSE_BUFFER_SIZE } from '../module/browser/mse/buffer_size';
import { MIN_MSE_BUFFER_SIZE } from '../module/browser/mse/buffer_size/min';
import { MSE_SUPPORTED } from '../module/browser/mse/supported';
import { NATIVE_HLS_SUPPORTED } from '../module/browser/native_hls_supported';
import { CAN_PLAY_AAC } from '../module/browser/can_play/codec/aac';
import { CAN_PLAY_AVC } from '../module/browser/can_play/codec/avc';
import { videoCanPlay } from '../module/browser/can_play/video';
import { audioCanPlay } from '../module/browser/can_play/audio';
import type { Player, Player as PlayerType } from '../module/player/player';
import { getFormatIndex, getEPFullURI } from './helper';
import { showHLSCompatibilityError, showCodecCompatibilityError, buildDownloadAccordion, showMediaMessage, showErrorMessage, incompatibleTitle, showPlayerError, buildAccordion, type AccordionInstance } from './media_helper';
import { toTimestampString } from '../module/string/timestamp';
import { encodeCloudfrontURIComponent } from '../module/string/uri/cloudfront/encode_component';
import { CustomMediaError } from '../module/player/media_error';
import { MediaSessionInfoKey, type MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { addOffloadCallback } from '../module/global/offload';
import { redirectSameOrigin } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import { hlsPlayerImportPromise, nativePlayerImportPromise } from './media_import_promise';
import { SharedElement, dereferenceErrorMessageElement, errorMessageElement, getSharedElement } from './shared_var';
import { type Interval } from '../module/timer/type';
import { removeInterval } from '../module/timer/remove/interval';
import { addInterval } from '../module/timer/add/interval';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { setPaddingTop } from '../module/style/padding_top';
import { CSS_COLOR } from '../module/style/color';
import { CSS_UNIT } from '../module/style/value/unit';
import { link as linkClass } from '../../css/link.module.scss';
import * as styles from '../../css/bangumi.module.scss';
import { PlayerKey } from '../module/player/player_key';
import { NonNativePlayerKey } from '../module/player/non_native_player_key';
import { NEWS_ROOT_URI } from '../module/env/uri';

let currentPgid: unknown;

let seriesID: string;
let epIndex: number;
let fileInfo: VideoFileInfo;
let baseURL: string;
let createMediaSessionPromise: Promise<MediaSessionInfo>;

let currentFormat: VideoFormat;
let currentMediaInstance: PlayerType | null = null;
let chaptersAccordionInstance: AccordionInstance | null = null;

const eventTargetsTracker = new Set<EventTarget>();
const timersTracker = new Set<Interval>();

export default function (
    _seriesID: string,
    _epIndex: number,
    _fileInfo: VideoFileInfo,
    _baseURL: string,
    _createMediaSessionPromise: Promise<MediaSessionInfo>,
) {
    currentPgid = pgid;

    seriesID = _seriesID;
    epIndex = _epIndex;
    fileInfo = _fileInfo;
    baseURL = _baseURL;
    createMediaSessionPromise = _createMediaSessionPromise;

    const contentContainer = getSharedElement(SharedElement.CONTENT_CONTAINER);
    addClass(contentContainer, styles.video);

    const startTimeText = getSearchParam('timestamp');
    let startTime: number | undefined = undefined;
    if (startTimeText !== null) {
        startTime = parseFloat(startTimeText);
        if (isNaN(startTime)) {
            startTime = undefined;
        }
    }
    const play = getSearchParam('play') === '1';

    // Title
    if (fileInfo[FileInfoKey.TITLE] !== undefined) {
        const title = createParagraphElement();
        addClass(title, styles.subTitle, styles.centerAlign);
        title.innerHTML = fileInfo[FileInfoKey.TITLE]; // This title is in HTML syntax.
        prependChild(contentContainer, title);
    }

    // Formats
    let formatIndex = getFormatIndex();
    const formats = fileInfo[FileInfoKey.FORMATS];

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

        option.value = format[VideoFormatKey.VALUE];
        appendText(option, (format[VideoFormatKey.TAG] === undefined) ? format[VideoFormatKey.VALUE] : format[VideoFormatKey.TAG]);

        if (index === formatIndex) {
            option.selected = true;
            currentFormat = format;
        }

        appendChild(selectMenu, option);
    });

    appendChild(formatSelector, selectMenu);
    disableDropdown(formatSelector, selectMenu, true);
    appendChild(formatContainer, formatSelector);

    const formatDisplay = createDivElement();
    addClass(formatDisplay, styles.formatDisplay);
    hideElement(formatDisplay);
    appendChild(formatContainer, formatDisplay);

    insertBefore(formatContainer, getSharedElement(SharedElement.MEDIA_HOLDER));

    createMediaSessionPromise.then((mediaSessionInfo) => {
        if (currentPgid !== pgid) {
            return;
        }
        const [downloadAccordion, containerSelector] = buildDownloadAccordion(mediaSessionInfo[MediaSessionInfoKey.CREDENTIAL], [selectMenu, formats, currentFormat]);
        appendChild(contentContainer, downloadAccordion);
        addEventListener(selectMenu, 'change', () => {
            formatSwitch(formatSelector, selectMenu, formatDisplay, containerSelector);
        });
    });

    addOffloadCallback(destroyMediaInstance);
    addVideoNode(formatDisplay, play, startTime, false).then(() => {
        disableDropdown(formatSelector, selectMenu, false);
    });
}

function formatSwitch(formatSelectMenuParent: HTMLDivElement, formatSelectMenu: HTMLSelectElement, formatDisplay: HTMLDivElement, containerSelector: HTMLElement) {
    disableDropdown(formatSelectMenuParent, formatSelectMenu, true);
    const formatIndex = formatSelectMenu.selectedIndex;

    const format = fileInfo[FileInfoKey.FORMATS][formatIndex];
    if (format === undefined) {
        return;
    }
    currentFormat = format;
    setHistoryState(getEPFullURI(seriesID, epIndex, formatIndex), true);

    if (format[VideoFormatKey.DIRECT_DOWNLOAD]) {
        hideElement(containerSelector);
    } else {
        showElement(containerSelector);
    }

    let startTime: number | undefined = undefined;
    let play: boolean | undefined = undefined;
    const mediaInstance = currentMediaInstance;
    if (mediaInstance !== null) {
        play = mediaInstance[PlayerKey.PLAYING];
        startTime = mediaInstance[PlayerKey.MEDIA].currentTime;
    }

    addVideoNode(formatDisplay, play, startTime, true).then(() => {
        if (mediaInstance === currentMediaInstance) {
            destroyMediaInstance();
        }
        if (currentMediaInstance === null) {
            hideElement(formatDisplay);
        }
        disableDropdown(formatSelectMenuParent, formatSelectMenu, false);
    });
}

async function addVideoNode(formatDisplay: HTMLDivElement, play: boolean | undefined, startTime: number | undefined, focus: boolean) {
    if (!MSE_SUPPORTED && !NATIVE_HLS_SUPPORTED) {
        showHLSCompatibilityError();
        return;
    }

    let formatString = '';
    const mediaMessageQueue: [string, Node[], CSS_COLOR | null][] = [];

    let USE_AVC = true;
    let AVC_FALLBACK = false;

    if (currentFormat[VideoFormatKey.VIDEO] === 'dv5') {
        if (!videoCanPlay('dvh1.05.06')) {
            showDolbyVisionError();
            return;
        }
        formatString = 'HEVC/Main 10/L5.1/High/dvhe.05.06';
        USE_AVC = false;
    } else if (currentFormat[VideoFormatKey.VIDEO] === 'hdr10') {
        if (!videoCanPlay('hvc1.2.4.H153.90')) {
            showErrorMessage(incompatibleTitle, [
                createTextNode('お使いのブラウザは、再生に必要なコーデックに対応していません。詳しくは'),
                createLinkElem('こちら', NEWS_ROOT_URI + 'UFzUoubmOzd'),
                createTextNode('をご覧ください。'),
            ]);
            return;
        }
        formatString = 'HEVC/Main 10/L5.1/High';
        USE_AVC = false;
        mediaMessageQueue.push(['HDR10について', [
            createTextNode('詳しくは'),
            createLinkElem('こちら', NEWS_ROOT_URI + '0p7hzGpxfMh'),
            createTextNode('をご覧ください。'),
        ], null]);
    } else if (currentFormat[VideoFormatKey.VIDEO]?.startsWith('hevc')) {
        const [level, levelText] = (() => {
            switch (currentFormat[VideoFormatKey.VIDEO]) {
                case 'hevc50':
                    return [HEVC_LEVEL.L5_0, '5.0'];
                default:
                    return [HEVC_LEVEL.L4_1, '4.1'];
            }
        })();
        const CAN_PLAY_HEVC = await canPlayHEVC(level, currentFormat[VideoFormatKey.AVC_FALLBACK]);
        if (currentPgid !== pgid) {
            return;
        }
        if (CAN_PLAY_HEVC) {
            formatString = 'HEVC/Main 10/L' + levelText + '/High';
            USE_AVC = false;
        } else if (currentFormat[VideoFormatKey.AVC_FALLBACK]) {
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
    if (currentFormat[VideoFormatKey.AUDIO] !== 'none') {
        USE_AAC = true;

        if (currentFormat[VideoFormatKey.AUDIO] !== undefined) {
            if (currentFormat[VideoFormatKey.AUDIO].startsWith('atmos')) {
                mediaMessageQueue.push(['Dolby Atmos®について', [
                    createTextNode('Dolby® TrueHDコアトラックとAC-3ダウンミックストラックのみを提供しています。詳しくは'),
                    createLinkElem('こちら', NEWS_ROOT_URI + 'yMq2BLvq-8Yq'),
                    createTextNode('をご覧ください。'),
                ], null]);
            }

            if (currentFormat[VideoFormatKey.AUDIO].startsWith('atmos_ac3')) {
                if (audioCanPlay('ac-3')) {
                    formatString += ' + AC-3';
                    USE_AAC = false;
                } else if (currentFormat[VideoFormatKey.AAC_FALLBACK]) {
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
            if (currentFormat[VideoFormatKey.AUDIO] !== 'raw_aac_lc') {
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
        const mediaHolder = getSharedElement(SharedElement.MEDIA_HOLDER);
        replaceChildren(mediaHolder, playerContainer);
        for (const mediaMessage of mediaMessageQueue) {
            showMediaMessage(...mediaMessage);
        }
        showElement(mediaHolder);
        const errorMsgElem = errorMessageElement;
        if (errorMsgElem !== null) {
            remove(errorMsgElem);
            dereferenceErrorMessageElement();
        }
    };
    const afterLoad = (mediaInstance: PlayerType) => {
        mediaInstance[PlayerKey.MEDIA].title = getTitle();
        if (fileInfo[FileInfoKey.CHAPTERS].length > 0) {
            displayChapters(mediaInstance, audioOffset, chaptersActive);
        }
        if (focus) {
            mediaInstance[PlayerKey.FOCUS]();
        }
    };

    const url = baseURL + encodeCloudfrontURIComponent('_MASTER_' + fileInfo[FileInfoKey.FILE_NAME] + '[' + currentFormat[VideoFormatKey.VALUE] + ']' + (AVC_FALLBACK ? '[AVC]' : '') + (AAC_FALLBACK ? '[AAC]' : '') + '.m3u8');
    if (NATIVE_HLS_SUPPORTED) {
        const Player = (await nativePlayerImportPromise).Player;
        await createMediaSessionPromise;
        if (currentPgid !== pgid) {
            return;
        }

        const mediaInstance = new Player(playerContainer, true);
        beforeLoad();
        currentMediaInstance = mediaInstance;
        mediaInstance[PlayerKey.LOAD](url, {
            onerror: function (errorCode: number | null) {
                showPlayerError(errorCode);
                destroyMediaInstance();
            },
            play: play,
            startTime: startTime,
        });
        afterLoad(mediaInstance);
    } else {
        const HlsPlayer = (await hlsPlayerImportPromise).HlsPlayer;
        await createMediaSessionPromise;
        if (currentPgid !== pgid) {
            return;
        }

        let gop = 15;
        let vbvMaxrate = 24000;
        let vbvBufsize = 50000;

        const rcVerStr = fileInfo[FileInfoKey.RC_VER];
        if (rcVerStr !== undefined) {
            const rcVer = parseInt(rcVerStr);
            switch (rcVer) {
                case 2:
                    gop = 12;
                    vbvMaxrate = 30000;
                    vbvBufsize = 60000;
                    break;
                default:
                    break;
            }
        }

        const maxBufferLength = (MSE_BUFFER_SIZE * 8 * 1024 - vbvBufsize) / vbvMaxrate - gop;
        const minBufferLength = (MIN_MSE_BUFFER_SIZE * 8 * 1024 - vbvBufsize) / vbvMaxrate - gop;
        const hlsConfig = {
            maxBufferLength: maxBufferLength,
            maxMaxBufferLength: maxBufferLength,
            mmsMinBufferLength: minBufferLength,
            minMaxBufferLength: minBufferLength,
            gop: gop,
        };

        if (ENABLE_DEBUG) {
            console.log('HLS config:', structuredClone(hlsConfig));
        }

        const mediaInstance = new HlsPlayer(playerContainer, hlsConfig, true);
        let bufferStalledMessageShown = false;
        beforeLoad();
        currentMediaInstance = mediaInstance;
        mediaInstance[NonNativePlayerKey.ON_BUFFER_STALLED] = () => {
            if (!bufferStalledMessageShown) {
                bufferStalledMessageShown = true;
                showMediaMessage(
                    '再生中に問題が発生した可能性があります',
                    'バッファリングに通常より時間がかかっています。遅いネットワークが原因かもしれません。または、デバイスのメモリが不足しています。このような場合、動画がスムーズに再生されるかどうかは保証できません。',
                    CSS_COLOR.ORANGE,
                );
            }
        };
        mediaInstance[PlayerKey.LOAD](url, {
            onerror: function (errorCode: number | null) {
                if (errorCode === CustomMediaError.HLS_BUFFER_APPEND_ERROR && currentFormat[VideoFormatKey.VIDEO] === 'dv5') {
                    showDolbyVisionError();
                } else {
                    showPlayerError(errorCode);
                }
                destroyMediaInstance();
            },
            play: play,
            startTime: startTime,
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
    for (const chapter of fileInfo[FileInfoKey.CHAPTERS]) {
        const chapterNode = createParagraphElement();
        const cueText = createTextNode('\xa0\xa0' + chapter[0]);
        const startTime = (chapter[1] + offset) / 1000;
        const timestamp = createSpanElement(toTimestampString(startTime));
        addEventListener(timestamp, 'click', () => {
            mediaInstance[PlayerKey.SEEK](startTime);
            mediaInstance[PlayerKey.FOCUS]();
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
    appendChild(getSharedElement(SharedElement.MEDIA_HOLDER), chaptersNode);

    const video = mediaInstance[PlayerKey.MEDIA];
    const updateChapterDisplay = () => {
        const currentTime = video.currentTime;
        fileInfo[FileInfoKey.CHAPTERS].forEach((chapter, index) => {
            const chapterElement = chapterElements[index] as HTMLElement;
            if (currentTime >= (chapter[1] + offset) / 1000) {
                const nextChapter = fileInfo[FileInfoKey.CHAPTERS][index + 1];
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
    };
    addEventsListener(video, ['play', 'pause', 'seeking', 'seeked'], updateChapterDisplay);
    const timer = addInterval(updateChapterDisplay, 500);
    timersTracker.add(timer);
}

function showDolbyVisionError() {
    showErrorMessage('Dolby Vision®に対応していません', [
        createTextNode('Dolby Vision®を再生できるブラウザは、Safariのみです。詳しくは'),
        createLinkElem('こちら', NEWS_ROOT_URI + '0p7hzGpxfMh'),
        createTextNode('をご覧ください。'),
    ]);
}

const enum HEVC_LEVEL {
    L4_1 = 123,
    L5_0 = 150,
}

async function canPlayHEVC(level: HEVC_LEVEL, withFallback: boolean | undefined): Promise<boolean> {
    const HEVC_CODEC = 'hvc1.2.4.H' + level + '.90';
    if (!videoCanPlay(HEVC_CODEC)) {
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
            type: NATIVE_HLS_SUPPORTED ? 'file' : 'media-source',
            video: {
                contentType: `video/mp4;codecs=${HEVC_CODEC}`,
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
    addClass(linkElem, linkClass);
    addEventListener(linkElem, 'click', () => {
        redirectSameOrigin(link);
    });
    return linkElem;
}

function disableDropdown(parent: HTMLDivElement, selectElement: HTMLSelectElement, disabled: boolean) {
    selectElement.disabled = disabled;
    if (disabled) {
        addClass(parent, styles.disabled);
    } else {
        removeClass(parent, styles.disabled);
    }
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
    currentMediaInstance?.[PlayerKey.DESTROY]();
    currentMediaInstance = null;
    cleanupEvents();
    chaptersAccordionInstance = null;
}
