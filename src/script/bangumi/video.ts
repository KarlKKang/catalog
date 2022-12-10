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
    removeClass,
    getByIdNative,
    remove,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import * as CDNCredentials from '../module/type/CDNCredentials';
import type { VideoEPInfo, VideoFormatInfo } from '../module/type/BangumiInfo';

import {
    USE_MSE,
    NATIVE_HLS,
    CAN_PLAY_AVC_AAC,
} from '../module/browser';
import { default as videojs } from 'video.js';
import { Player, HlsPlayer } from '../module/player';

import { updateURLParam, getLogoutParam, getFormatIndex } from './helper';
import { showPlaybackError, showHLSCompatibilityError, showCodecCompatibilityError, getDownloadAccordion, addAccordionEvent } from './media_helper';
import type { HlsImportPromise } from './get_import_promises';
import type { ErrorData, Events } from '../../../custom_modules/hls.js';

let seriesID: string;
let epIndex: number;
let epInfo: VideoEPInfo;
let baseURL: string;
let mediaHolder: HTMLElement;
let hlsImportPromise: HlsImportPromise;
let debug: boolean;

let currentFormat: VideoFormatInfo;
let currentMediaInstance: Player | undefined;

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: VideoEPInfo,
    _baseURL: string,
    _mediaHolder: HTMLElement,
    _hlsImportPromise: HlsImportPromise,
    _debug: boolean
) {

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    mediaHolder = _mediaHolder;
    hlsImportPromise = _hlsImportPromise;
    debug = _debug;

    addClass(mediaHolder, 'video');
    const contentContainer = getById('content');

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
    addVideoNode();
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
                play?: boolean | undefined,
                startTime?: number | undefined,
            } | undefined;

            if (currentMediaInstance !== undefined) {
                config = {
                    play: !currentMediaInstance.paused,
                    startTime: currentMediaInstance.media.currentTime
                }

                currentMediaInstance.destroy();
                currentMediaInstance = undefined;
            }

            mediaHolder.textContent = '';
            const errorMsgElem = getByIdNative('error');
            errorMsgElem && remove(errorMsgElem);
            removeClass(mediaHolder, 'hidden');
            addVideoNode(config);
        },
        content: 'token=' + epInfo.authentication_token + '&format=' + formatIndex,
        logoutParam: getLogoutParam(seriesID, epIndex)
    });
}

function addVideoNode(config?: {
    play?: boolean | undefined,
    startTime?: number | undefined,
}) {
    if (!USE_MSE && !NATIVE_HLS) {
        showHLSCompatibilityError();
        return;
    }
    if (!CAN_PLAY_AVC_AAC) {
        showCodecCompatibilityError();
        return;
    }

    const _config = config ?? {};

    function _onInit(mediaInstance: Player) {
        mediaInstance.media.title = getTitle();
        if (epInfo.chapters.length > 0) {
            displayChapters(mediaInstance);
        }
    }

    const videoJS = createElement('video-js');

    addClass(videoJS, 'vjs-big-play-centered');
    videoJS.lang = 'en';
    appendChild(mediaHolder, videoJS);

    const vjsConfig = {
        controls: true,
        autoplay: false,
        fluid: true,
    };

    const videojsInstance = videojs(videoJS, vjsConfig, function () {
        videoJS.style.paddingTop = 9 / 16 * 100 + '%';
        const url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + currentFormat.value + '].m3u8'), epInfo.cdn_credentials);

        if (USE_MSE) {
            const hlsConfig = {
                enableWebVTT: false,
                enableIMSC1: false,
                enableCEA708Captions: false,
                lowLatencyMode: false,
                enableWorker: false,
                maxFragLookUpTolerance: 0.0,
                testBandwidth: false,
                backBufferLength: 0,
                maxBufferLength: 16, // (100 * 8 * 1000 - 168750) / 20000 - 15
                maxBufferSize: 0, // (100 - (20 * 15 + 168.75) / 8) * 1000 * 1000 (This buffer size will be exceeded sometimes)
                maxBufferHole: 0.5, // In Safari 12, without this option video will stall at the start. Although the value 0.5 is the default in the documentation, this option somehow must be explictly set to take effect.
                debug: debug,
                xhrSetup: function (xhr: XMLHttpRequest) {
                    xhr.withCredentials = true;
                }
            }

            hlsImportPromise.then(({ default: Hls }) => {
                const mediaInstance = new HlsPlayer(videojsInstance, Hls, hlsConfig, {
                    debug: debug
                });
                currentMediaInstance = mediaInstance;
                mediaInstance.load(url, {
                    onerror: function (_: Events.ERROR, data: ErrorData) {
                        if (data.fatal) {
                            showPlaybackError(data.details);
                            currentMediaInstance = undefined;
                            mediaInstance.destroy();
                        }
                    },
                    play: _config.play,
                    startTime: _config.startTime
                });
                _onInit(mediaInstance);
            }).catch((e) => {
                showMessage(moduleImportError(e));
                return;
            });
        } else {
            const mediaInstance = new Player(videojsInstance, {
                debug: debug
            });
            currentMediaInstance = mediaInstance;
            mediaInstance.load(url, {
                onerror: function () {
                    showPlaybackError();
                    currentMediaInstance = undefined;
                    mediaInstance.destroy();
                },
                play: _config.play,
                startTime: _config.startTime
            });
            _onInit(mediaInstance);
        }
    });
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