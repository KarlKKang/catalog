import { getParentElement } from '../module/dom/get_element';
import { appendChild, insertBefore, prependChild, remove, replaceChildren } from '../module/dom/change_node';
import { addClass, removeClass, setClass } from '../module/dom/class';
import { appendText, createDivElement, createOptionElement, createParagraphElement, createSelectElement, createSpanElement, createTextNode, replaceText } from '../module/dom/create_element';
import { changeURL, getSearchParam, getTitle } from '../module/dom/document';
import { addEventListener, addEventsListener, removeAllEventListeners } from '../module/event_listener';
import { EPInfoKey, VideoFormatKey, type VideoEPInfo, type VideoFormat } from '../module/type/BangumiInfo';
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
import { getFormatIndex, createQuery } from './helper';
import { showHLSCompatibilityError, showCodecCompatibilityError, buildDownloadAccordion, showMediaMessage, showErrorMessage, incompatibleTitle, incompatibleSuffix, showPlayerError, buildAccordion, type AccordionInstance } from './media_helper';
import { secToTimestamp } from '../module/time';
import { encodeCFURIComponent, buildURI } from '../module/http_form';
import { CustomMediaError } from '../module/player/media_error';
import { MediaSessionInfoKey, type MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid, redirect } from '../module/global';
import { hlsPlayerImportPromise, nativePlayerImportPromise } from './media_import_promise';
import { SharedElement, errorMessageElement, getSharedElement, setErrorMessageElement } from './shared_var';
import { addInterval, type Interval, removeInterval } from '../module/timer';
import { hideElement, setPaddingTop, showElement } from '../module/style';
import { CSS_COLOR, CSS_UNIT } from '../module/style/value';
import * as commonStyles from '../../css/common.module.scss';
import * as styles from '../../css/bangumi.module.scss';
import { importModule } from '../module/import_module';
import { PlayerKey } from '../module/player/player_key';
import { NonNativePlayerKey } from '../module/player/non_native_player_key';
import { BANGUMI_ROOT_URI, NEWS_ROOT_URI } from '../module/env/uri';

let currentPgid: unknown;

let seriesID: string;
let epIndex: number;
let epInfo: VideoEPInfo;
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
    if (epInfo[EPInfoKey.TITLE] !== undefined) {
        const title = createParagraphElement();
        addClass(title, styles.subTitle, styles.centerAlign);
        title.innerHTML = epInfo[EPInfoKey.TITLE]; // This title is in HTML syntax.
        prependChild(contentContainer, title);
    }

    // Formats
    let formatIndex = getFormatIndex();
    const formats = epInfo[EPInfoKey.FORMATS];

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
    disableDropdown(selectMenu, true);
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
        const [downloadAccordion, containerSelector] = buildDownloadAccordion(mediaSessionInfo[MediaSessionInfoKey.CREDENTIAL], seriesID, epIndex, [selectMenu, formats, currentFormat]);
        appendChild(contentContainer, downloadAccordion);
        addEventListener(selectMenu, 'change', () => {
            formatSwitch(selectMenu, formatDisplay, containerSelector);
        });
    });

    addVideoNode(formatDisplay, play, startTime, false).then(() => {
        disableDropdown(selectMenu, false);
    });
}

function formatSwitch(formatSelectMenu: HTMLSelectElement, formatDisplay: HTMLDivElement, containerSelector: HTMLElement) {
    disableDropdown(formatSelectMenu, true);
    const formatIndex = formatSelectMenu.selectedIndex;

    const format = epInfo[EPInfoKey.FORMATS][formatIndex];
    if (format === undefined) {
        return;
    }
    currentFormat = format;
    updateURLParam(seriesID, epIndex, formatIndex);

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
        disableDropdown(formatSelectMenu, false);
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
    } else if (currentFormat[VideoFormatKey.VIDEO] === 'hevc41') {
        const CAN_PLAY_HEVC = await canPlayHEVC(currentFormat[VideoFormatKey.AVC_FALLBACK]);
        if (currentPgid !== pgid) {
            return;
        }
        if (CAN_PLAY_HEVC) {
            formatString = 'HEVC/Main 10/L4.1/High';
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
            setErrorMessageElement(null);
        }
    };
    const afterLoad = (mediaInstance: PlayerType) => {
        mediaInstance[PlayerKey.MEDIA].title = getTitle();
        if (epInfo[EPInfoKey.CHAPTERS].length > 0) {
            displayChapters(mediaInstance, audioOffset, chaptersActive);
        }
        if (focus) {
            mediaInstance[PlayerKey.FOCUS]();
        }
    };

    const url = baseURL + encodeCFURIComponent('_MASTER_' + epInfo[EPInfoKey.FILE_NAME] + '[' + currentFormat[VideoFormatKey.VALUE] + ']' + (AVC_FALLBACK ? '[AVC]' : '') + (AAC_FALLBACK ? '[AAC]' : '') + '.m3u8');
    if (!MSE_SUPPORTED) {
        const Player = (await importModule(nativePlayerImportPromise)).Player;
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
        const HlsPlayer = (await importModule(hlsPlayerImportPromise)).HlsPlayer;
        await createMediaSessionPromise;
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
                if (errorCode === CustomMediaError.HLS_BUFFER_APPEND_ERROR) {
                    if (currentFormat[VideoFormatKey.VIDEO] === 'dv5') {
                        showDolbyVisionError();
                    } else if (currentFormat[VideoFormatKey.AUDIO] === 'atmos_aac_8ch' && (IS_CHROMIUM || IS_FIREFOX)) {
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
    for (const chapter of epInfo[EPInfoKey.CHAPTERS]) {
        const chapterNode = createParagraphElement();
        const cueText = createTextNode('\xa0\xa0' + chapter[0]);
        const startTime = (chapter[1] + offset) / 1000;
        const timestamp = createSpanElement(secToTimestamp(startTime));
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
        epInfo[EPInfoKey.CHAPTERS].forEach((chapter, index) => {
            const chapterElement = chapterElements[index] as HTMLElement;
            if (currentTime >= (chapter[1] + offset) / 1000) {
                const nextChapter = epInfo[EPInfoKey.CHAPTERS][index + 1];
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

function show8chAudioError() {
    showErrorMessage(incompatibleTitle, 'ChromiumベースのブラウザとFirefoxでは、7.1chオーディオを再生することはできません。' + incompatibleSuffix);
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
    changeURL(buildURI(
        BANGUMI_ROOT_URI + seriesID,
        createQuery(epIndex, formatIndex),
    ), true);
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

export function offload() {
    destroyMediaInstance();
}
