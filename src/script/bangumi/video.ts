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
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import * as CDNCredentials from '../module/type/CDNCredentials';
import type { VideoEPInfo, Chapters } from '../module/type/BangumiInfo';

import {
    IS_DESKTOP,
    IS_LEGACY,
    IS_LINUX,
    USE_MSE,
    NATIVE_HLS,
    CAN_PLAY_AVC_AAC,
} from '../module/browser';
import { default as videojs } from 'video.js';
import { Player, HlsPlayer } from '../module/player';

import { updateURLParam, getLogoutParam, getFormatIndex } from './helper';
import { showPlaybackError, showHLSCompatibilityError, showCodecCompatibilityError, getDownloadAccordion, addAccordionEvent, showLegacyBrowserError } from './media_helper';
import type { HlsImportPromise } from './get_import_promises';
import type { ErrorData, Events } from 'hls.js';

let seriesID: string;
let epIndex: number;
let epInfo: VideoEPInfo;
let baseURL: string;
let mediaHolder: HTMLElement;
let hlsImportPromise: HlsImportPromise;
let debug: boolean;

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
        }

        appendChild(selectMenu, option);
    });

    appendChild(formatSelector, selectMenu);
    insertBefore(formatSelector, mediaHolder);

    // Download Accordion
    if (IS_DESKTOP) {
        appendChild(contentContainer, getDownloadAccordion(epInfo.authentication_token, seriesID, epIndex));
    }

    // Video Node
    if (IS_LEGACY) {
        showLegacyBrowserError();
        addEventListener(selectMenu, 'change', function () { formatSwitch(); });
        return;
    }
    if (!USE_MSE && !NATIVE_HLS) {
        showHLSCompatibilityError();
        addEventListener(selectMenu, 'change', function () { formatSwitch(); });
        return;
    }
    if (!CAN_PLAY_AVC_AAC) {
        showCodecCompatibilityError(IS_LINUX);
        addEventListener(selectMenu, 'change', function () { formatSwitch(); });
        return;
    }

    const videoJS = createElement('video-js');

    addClass(videoJS, 'vjs-big-play-centered');
    videoJS.lang = 'en';
    appendChild(mediaHolder, videoJS);

    const config = {
        controls: true,
        autoplay: false,
        fluid: true,
    } as const;

    const videojsInstance = videojs(videoJS, config, function () {
        videoJS.style.paddingTop = 9 / 16 * 100 + '%';
        const url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + selectMenu.value + '].m3u8'), epInfo.cdn_credentials);
        addVideoNode(url, videojsInstance, function (mediaInstance: Player) {
            mediaInstance.media.title = getTitle();
            addEventListener(selectMenu, 'change', function () { formatSwitch(mediaInstance); });
            if (epInfo.chapters.length > 0) {
                displayChapters(epInfo.chapters, mediaInstance);
            }
        });
    });
}

function formatSwitch(mediaInstance?: Player) {
    const formatSelector = (getDescendantsByTagAt(getById('format-selector'), 'select', 0) as HTMLSelectElement);
    const formatIndex = formatSelector.selectedIndex;

    updateURLParam(seriesID, epIndex, formatIndex);

    if (mediaInstance === undefined) {
        return;
    }

    sendServerRequest('format_switch.php', {
        callback: function (response: string) {
            const currentTime = mediaInstance.media.currentTime;
            const paused = mediaInstance.paused;

            let parsedResponse: CDNCredentials.CDNCredentials;
            try {
                parsedResponse = JSON.parse(response);
                CDNCredentials.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            const url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + formatSelector.value + '].m3u8'), parsedResponse);
            mediaInstance.load(url, {
                play: !paused,
                startTime: currentTime
            });
        },
        content: 'token=' + epInfo.authentication_token + '&format=' + formatIndex,
        logoutParam: getLogoutParam(seriesID, epIndex)
    });
}

function addVideoNode(url: string, videojsInstance: videojs.Player, onattached: (mediaInstance: Player) => void) {
    if (USE_MSE) {
        const config = {
            enableWebVTT: false,
            enableIMSC1: false,
            enableCEA708Captions: false,
            lowLatencyMode: false,
            enableWorker: false,
            maxFragLookUpTolerance: 0.0,
            testBandwidth: false,
            backBufferLength: 30,
            maxBufferLength: 45,
            maxMaxBufferLength: 90,
            maxBufferSize: 0,
            maxBufferHole: 0,
            debug: debug,
            xhrSetup: function (xhr: XMLHttpRequest) {
                xhr.withCredentials = true;
            }
        }

        hlsImportPromise.then(({ default: Hls }) => {
            const hls = new Hls(config);
            const mediaInstance = new HlsPlayer(videojsInstance, hls, Hls, {
                debug: debug
            });
            mediaInstance.load(url, {
                onerror: function (_: Events.ERROR, data: ErrorData) {
                    if (data.fatal) {
                        showPlaybackError(data.details);
                        mediaInstance.destroy();
                    }
                }
            });
            onattached(mediaInstance);
        }).catch((e) => {
            showMessage(moduleImportError(e));
            return;
        });
    } else if (NATIVE_HLS) {
        const mediaInstance = new Player(videojsInstance, {
            debug: debug
        });
        mediaInstance.load(url, {
            onerror: function () {
                showPlaybackError();
                mediaInstance.destroy();
            }
        })
        onattached(mediaInstance);
    }
}

function displayChapters(chapters: Chapters, mediaInstance: Player) {
    const accordion = createElement('button');
    addClass(accordion, 'accordion');
    accordion.innerHTML = 'CHAPTERS';

    const accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    const video = mediaInstance.media;

    for (const chapter of chapters) {
        const chapterNode = createElement('p');
        const timestamp = createElement('span');
        const cueText = createTextNode('\xa0\xa0' + chapter[0]);
        const startTime = chapter[1];
        timestamp.innerHTML = secToTimestamp(startTime);
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

    const updateChapterDisplay = function () {
        const chapterElements = getDescendantsByTag(accordionPanel, 'p');
        const currentTime = video.currentTime;
        chapters.forEach(function (chapter, index) {
            const chapterElement = chapterElements[index] as HTMLElement;
            if (currentTime >= chapter[1]) {
                const nextChapter = chapters[index + 1];
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
    };

    //video.addEventListener ('timeupdate', updateChapterDisplay);
    setInterval(updateChapterDisplay, 500);
    addEventsListener(video, ['play', 'pause', 'seeking', 'seeked'], updateChapterDisplay);
}