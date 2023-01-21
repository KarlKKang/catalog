import {
    sendServerRequest,
    secToTimestamp,
    concatenateSignedURL,
    encodeCFURIComponent,
} from '../module/main';
import {
    addEventListener,
    getById,
    createElement,
    addClass,
    getDescendantsByTagAt,
    getTitle,
    setClass,
    getDescendantsByTag,
    createTextNode,
    addEventsListener,
    appendChild,
    prependChild,
    insertBefore,
    getByIdNative,
    remove,
    showElement,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import * as CDNCredentials from '../module/type/CDNCredentials';
import type { VideoEPInfo, VideoFormatInfo } from '../module/type/BangumiInfo';

import {
    USE_MSE,
    NATIVE_HLS,
    CAN_PLAY_AVC,
    CAN_PLAY_AAC,
    videoCanPlay,
    CAN_PLAY_AC3,
    IS_CHROMIUM,
    IS_FIREFOX,
} from '../module/browser';
import type { Player, Player as PlayerType } from '../module/player/player';
import type { HlsPlayer as HlsPlayerType } from '../module/player/hls_player';
import type { DashPlayer as DashPlayerType } from '../module/player/dash_player';

import { updateURLParam, getLogoutParam, getFormatIndex } from './helper';
import { showPlaybackError, showHLSCompatibilityError, showCodecCompatibilityError, getDownloadAccordion, addAccordionEvent, showMediaMessage, showErrorMessage, incompatibleTitle, showPlayPromiseError, incompatibleSuffix } from './media_helper';
import type { NativePlayerImportPromise, DashjsPlayerImportPromise, HlsPlayerImportPromise } from './get_import_promises';
import type { ErrorData, Events } from 'hls.js';
import { ErrorDetails as HlsErrorDetails } from 'hls.js';

let seriesID: string;
let epIndex: number;
let epInfo: VideoEPInfo;
let baseURL: string;
let mediaHolder: HTMLElement;
let nativePlayerImportPromise: NativePlayerImportPromise;
let hlsPlayerImportPromise: HlsPlayerImportPromise;
let dashjsPlayerImportPromise: DashjsPlayerImportPromise;
let debug: boolean;
let av1Override: boolean;

let currentFormat: VideoFormatInfo;
let currentMediaInstance: PlayerType | undefined;

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: VideoEPInfo,
    _baseURL: string,
    _mediaHolder: HTMLElement,
    _nativePlayerImportPromise: NativePlayerImportPromise,
    _hlsPlayerImportPromise: HlsPlayerImportPromise,
    _dashjsPlayerImportPromise: DashjsPlayerImportPromise,
    _debug: boolean,
    _av1Override: boolean,
    startTime: number | null,
    play: boolean
) {

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    mediaHolder = _mediaHolder;
    nativePlayerImportPromise = _nativePlayerImportPromise;
    hlsPlayerImportPromise = _hlsPlayerImportPromise;
    dashjsPlayerImportPromise = _dashjsPlayerImportPromise;
    debug = _debug;
    av1Override = _av1Override;

    const contentContainer = getById('content');
    addClass(contentContainer, 'video');

    // Title
    if (epInfo.title != '') {
        const title = createElement('p');
        addClass(title, 'sub-title');
        addClass(title, 'center-align');
        title.innerHTML = epInfo.title;
        prependChild(contentContainer, title);
    }

    // Formats
    let formatIndex = getFormatIndex();
    const formats = epInfo.formats;

    const formatSelector = createElement('div');
    formatSelector.id = 'format-selector';
    addClass(formatSelector, 'select');

    const selectMenu = createElement('select') as HTMLSelectElement;

    if (formatIndex >= formats.length) {
        formatIndex = 0;
    }
    updateURLParam(seriesID, epIndex, formatIndex);

    formats.forEach(function (format, index) {
        const option = createElement('option') as HTMLOptionElement;

        option.value = format.value;
        option.innerHTML = (format.tag === undefined) ? format.value : format.tag;

        if (index == formatIndex) {
            option.selected = true;
            currentFormat = format;
        }

        appendChild(selectMenu, option);
    });

    appendChild(formatSelector, selectMenu);
    insertBefore(formatSelector, mediaHolder);

    // Download Accordion
    appendChild(contentContainer, getDownloadAccordion(epInfo.authentication_token, seriesID, epIndex));

    // Video Node
    addEventListener(selectMenu, 'change', formatSwitch);
    addVideoNode({
        startTime: startTime === null ? undefined : startTime,
        play: play
    });
}

function formatSwitch() {
    const formatSelector = (getDescendantsByTagAt(getById('format-selector'), 'select', 0) as HTMLSelectElement);
    const formatIndex = formatSelector.selectedIndex;

    const format = epInfo.formats[formatIndex];
    if (format === undefined) {
        return;
    }
    currentFormat = format;
    updateURLParam(seriesID, epIndex, formatIndex);

    sendServerRequest('format_switch.php', {
        callback: function (response: string) {
            let parsedResponse: CDNCredentials.CDNCredentials;
            try {
                parsedResponse = JSON.parse(response);
                CDNCredentials.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            epInfo.cdn_credentials = parsedResponse;

            let config: {
                play?: boolean | undefined;
                startTime?: number | undefined;
            } | undefined;

            if (currentMediaInstance !== undefined) {
                config = {
                    play: !currentMediaInstance.paused,
                    startTime: currentMediaInstance.media.currentTime
                };

                currentMediaInstance.destroy();
                currentMediaInstance = undefined;
            }

            mediaHolder.textContent = '';
            const errorMsgElem = getByIdNative('error');
            errorMsgElem && remove(errorMsgElem);
            showElement(mediaHolder);
            addVideoNode(config);
        },
        content: 'token=' + epInfo.authentication_token + '&format=' + formatIndex,
        logoutParam: getLogoutParam(seriesID, epIndex)
    });
}

async function addVideoNode(config?: {
    play?: boolean | undefined;
    startTime?: number | undefined;
}) {
    if (!USE_MSE && !NATIVE_HLS) {
        showHLSCompatibilityError();
        return;
    }

    let AV1_FALLBACK = USE_MSE && currentFormat.av1_fallback !== undefined && videoCanPlay(currentFormat.av1_fallback);

    if (currentFormat.video === 'dv5') {
        if (!videoCanPlay('dvh1.05.06')) {
            showDolbyVisionError();
            return;
        }
    } else if (currentFormat.video === 'hdr10') {
        showMediaMessage('HDR10について', '詳しくは<a class="link" href="https://featherine.com/news/0p7hzGpxfMh" target="_blank">こちら</a>をご覧ください。', null);
        if (videoCanPlay('hvc1.2.4.H153.90')) {
            if (!av1Override) {
                AV1_FALLBACK = false;
            }
        } else if (AV1_FALLBACK) {
            showMediaMessage('HEVCに対応していません', 'AV1でエンコードされた動画が代わりに再生されています。詳しくは<a class="link" href="https://featherine.com/news/UFzUoubmOzd" target="_blank">こちら</a>をご覧ください。', 'orange');
        } else {
            showErrorMessage(incompatibleTitle, 'お使いのブラウザは、再生に必要なコーデックに対応していません。詳しくは<a class="link" href="https://featherine.com/news/UFzUoubmOzd" target="_blank">こちら</a>をご覧ください。');
            return;
        }
    } else {
        if (!CAN_PLAY_AVC) {
            showCodecCompatibilityError();
            return;
        }
    }

    let USE_AAC = true;
    let AAC_FALLBACK = false;

    if (currentFormat.audio !== undefined) {
        if (currentFormat.audio.startsWith('atmos')) {
            showMediaMessage('Dolby Atmos®について', 'Dolby® TrueHDコアトラックとAC-3ダウンミックストラックのみを提供しています。詳しくは<a class="link" href="https://featherine.com/news/yMq2BLvq-8Yq" target="_blank">こちら</a>をご覧ください。', null);
        }

        if (currentFormat.audio.startsWith('atmos_ac3') && !AV1_FALLBACK) {
            if (CAN_PLAY_AC3) {
                USE_AAC = false;
            } else if (currentFormat.aac_fallback) {
                AAC_FALLBACK = true;
            } else {
                showCodecCompatibilityError();
                return;
            }
        }
    }

    if (USE_AAC && !CAN_PLAY_AAC) {
        showCodecCompatibilityError();
        return;
    }

    const _config = config ?? {};

    function _onInit(mediaInstance: PlayerType) {
        mediaInstance.media.title = getTitle();
        if (epInfo.chapters.length > 0) {
            displayChapters(mediaInstance);
        }
    }
    function onPlayPromiseError() {
        showPlayPromiseError();
        if (currentMediaInstance !== undefined) {
            currentMediaInstance.destroy();
            currentMediaInstance = undefined;
        }
    }


    const playerContainer = createElement('div') as HTMLDivElement;
    appendChild(mediaHolder, playerContainer);
    playerContainer.style.paddingTop = 9 / 16 * 100 + '%';

    const resourceURLOverride = (currentFormat.av1_fallback === undefined && currentFormat.aac_fallback === undefined) ? undefined : baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + currentFormat.value + ']*');
    if (AV1_FALLBACK) {
        const url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + currentFormat.value + '][AV1].mpd'), epInfo.cdn_credentials, resourceURLOverride);

        let DashPlayer: typeof DashPlayerType;
        try {
            DashPlayer = (await dashjsPlayerImportPromise).DashPlayer;
        } catch (e) {
            showMessage(moduleImportError(e));
            throw e;
        }

        const dashjsConfig = {
            debug: {
                logLevel: debug ? 5 : 3
            },
            streaming: {
                fragmentRequestTimeout: 60000,
                gaps: {
                    enableStallFix: true,
                    jumpLargeGaps: false,
                    smallGapLimit: 0.5
                },
                buffer: {
                    bufferPruningInterval: 1,
                    flushBufferAtTrackSwitch: true,
                    bufferToKeep: 0,
                    bufferTimeAtTopQuality: 15,
                    bufferTimeAtTopQualityLongForm: 15,
                    avoidCurrentTimeRangePruning: true,
                }
            }
        };

        const mediaInstance = new DashPlayer(playerContainer, dashjsConfig, {
            debug: debug
        });
        currentMediaInstance = mediaInstance;
        mediaInstance.load(url, {
            onerror: function (e: dashjs.ErrorEvent) {
                if (typeof e.error === 'object' && e.error.code < 10 && currentFormat.audio === 'atmos_aac_8ch' && (IS_CHROMIUM || IS_FIREFOX)) {
                    show8chAudioError();
                } else {
                    showPlaybackError(JSON.stringify(e.error));
                }
                currentMediaInstance = undefined;
                mediaInstance.destroy();
            },
            onplaypromiseerror: onPlayPromiseError,
            play: _config.play,
            startTime: _config.startTime
        });
        _onInit(mediaInstance);
    } else {
        const url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + currentFormat.value + ']' + (AAC_FALLBACK ? '[AAC]' : '') + '.m3u8'), epInfo.cdn_credentials, resourceURLOverride);
        if (USE_MSE) {
            let HlsPlayer: typeof HlsPlayerType;
            try {
                HlsPlayer = (await hlsPlayerImportPromise).HlsPlayer;
            } catch (e) {
                showMessage(moduleImportError(e));
                throw e;
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
                fragLoadingTimeOut: 60000,
                debug: debug,
                xhrSetup: function (xhr: XMLHttpRequest) {
                    xhr.withCredentials = true;
                }
            };

            const mediaInstance = new HlsPlayer(playerContainer, hlsConfig, {
                debug: debug
            });
            currentMediaInstance = mediaInstance;
            mediaInstance.load(url, {
                onerror: function (_: Events.ERROR, data: ErrorData) {
                    if (data.fatal) {
                        if (data.details === HlsErrorDetails.BUFFER_APPEND_ERROR) {
                            if (currentFormat.video === 'dv5') {
                                showDolbyVisionError();
                            } else if (currentFormat.audio === 'atmos_aac_8ch' && (IS_CHROMIUM || IS_FIREFOX)) {
                                show8chAudioError();
                            } else {
                                showCodecCompatibilityError();
                            }
                        } else {
                            showPlaybackError(data.details);
                        }
                        currentMediaInstance = undefined;
                        mediaInstance.destroy();
                    }
                },
                onplaypromiseerror: onPlayPromiseError,
                play: _config.play,
                startTime: _config.startTime
            });
            _onInit(mediaInstance);
        } else {
            let Player: typeof PlayerType;
            try {
                Player = (await nativePlayerImportPromise).Player;
            } catch (e) {
                showMessage(moduleImportError(e));
                throw e;
            }

            const mediaInstance = new Player(playerContainer, {
                debug: debug
            });
            currentMediaInstance = mediaInstance;
            mediaInstance.load(url, {
                onerror: function () {
                    showPlaybackError();
                    currentMediaInstance = undefined;
                    mediaInstance.destroy();
                },
                onplaypromiseerror: onPlayPromiseError,
                play: _config.play,
                startTime: _config.startTime
            });
            _onInit(mediaInstance);
        }
    }
}

function displayChapters(mediaInstance: Player) {
    const accordion = createElement('button');
    addClass(accordion, 'accordion');
    accordion.textContent = 'CHAPTERS';

    const accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    for (const chapter of epInfo.chapters) {
        const chapterNode = createElement('p');
        const timestamp = createElement('span');
        const cueText = createTextNode('\xa0\xa0' + chapter[0]);
        const startTime = chapter[1];
        timestamp.textContent = secToTimestamp(startTime);
        addEventListener(timestamp, 'click', function () {
            mediaInstance.seek(startTime);
            mediaInstance.controls.focus();
        });
        appendChild(chapterNode, timestamp);
        appendChild(chapterNode, cueText);
        setClass(chapterNode, 'inactive-chapter');
        appendChild(accordionPanel, chapterNode);
    }

    const chaptersNode = createElement('div');
    addClass(chaptersNode, 'chapters');
    appendChild(chaptersNode, accordion);
    appendChild(chaptersNode, accordionPanel);
    addAccordionEvent(accordion);
    appendChild(mediaHolder, chaptersNode);

    const video = mediaInstance.media;
    const chapterElements = getDescendantsByTag(accordionPanel, 'p');
    function updateChapterDisplay() {
        const currentTime = video.currentTime;
        epInfo.chapters.forEach(function (chapter, index) {
            const chapterElement = chapterElements[index] as HTMLElement;
            if (currentTime >= chapter[1]) {
                const nextChapter = epInfo.chapters[index + 1];
                if (nextChapter === undefined) {
                    setClass(chapterElement, 'current-chapter');
                } else if (currentTime < nextChapter[1]) {
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
    showErrorMessage('Dolby Vision®に対応していません', 'Dolby Vision®を再生できるブラウザは、Safariのみです。詳しくは<a class="link" href="https://featherine.com/news/0p7hzGpxfMh" target="_blank">こちら</a>をご覧ください。');
}

function show8chAudioError() {
    showErrorMessage(incompatibleTitle, 'ChromiumベースのブラウザとFirefoxでは、7.1chオーディオを再生することはできません。' + incompatibleSuffix);
}