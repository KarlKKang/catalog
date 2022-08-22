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
    insertBefore,
    getDescendantsByTagAt,
    getTitle,
    setClass,
    getDescendantsByTag,
    createTextNode,
    addEventsListener,
    appendChild,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import { CDNCredentials } from '../module/type';
import type { BangumiInfo } from '../module/type';

import { videojs, browser, videojsMod } from '../module/player';
import type { VideojsModInstance } from '../module/player';

import { updateURLParam, getLogoutParam, getFormatIndex } from './helper';
import { destroyAll, showPlaybackError, showHLSCompatibilityError, showCodecCompatibilityError, getDownloadAccordion, addAccordionEvent, showLegacyBrowserError } from './media_helper';
import type { HlsImportPromise } from './get_import_promises';

let seriesID: string;
let epIndex: number;
let epInfo: BangumiInfo.VideoEPInfo;
let baseURL: string;
let mediaHolder: HTMLElement;
let contentContainer: HTMLElement;
let debug: boolean;

let hlsImportPromise: HlsImportPromise;

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: BangumiInfo.VideoEPInfo,
    _baseURL: string,
    _mediaHolder: HTMLElement,
    _contentContainer: HTMLElement,
    _hlsImportPromise: HlsImportPromise,
    _debug: boolean
) {

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    mediaHolder = _mediaHolder;
    contentContainer = _contentContainer;
    hlsImportPromise = _hlsImportPromise;
    debug = _debug;

    addClass(mediaHolder, 'video');

    // Title
    if (epInfo.title != '') {
        const title = createElement('p');
        addClass(title, 'sub-title');
        addClass(title, 'center-align');
        title.innerHTML = epInfo.title;
        insertBefore(title, getById('message'));
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
    insertBefore(formatSelector, getById('message'));

    // Download Accordion
    if (browser.IS_DESKTOP) {
        appendChild(contentContainer, getDownloadAccordion(epInfo.authentication_token, seriesID, epIndex));
    }

    // Video Node
    if (browser.IS_LEGACY) {
        showLegacyBrowserError();
        return;
    }
    if (!browser.USE_MSE && !browser.NATIVE_HLS) {
        showHLSCompatibilityError();
        addClass(mediaHolder, 'hidden');
        return;
    }
    if (!browser.CAN_PLAY_AVC_AAC) {
        showCodecCompatibilityError(browser.IS_LINUX);
        addClass(mediaHolder, 'hidden');
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

    videojs(videoJS, config, function () {
        videoJS.style.paddingTop = 9 / 16 * 100 + '%';

        const mediaInstance = videojsMod(this, { debug: debug });

        addEventListener(selectMenu, "change", function () {
            formatSwitch(mediaInstance);
        });

        const url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + selectMenu.value + '].m3u8'), epInfo.cdn_credentials);

        addVideoNode(url, mediaInstance, {/*, currentTime: timestampParam*/ });
        if (epInfo.chapters.length > 0) {
            displayChapters(epInfo.chapters, mediaInstance);
        }
        //updateURLTimestamp();
    });
}

function formatSwitch(mediaInstance: VideojsModInstance) {
    const formatSelector = (getDescendantsByTagAt(getById('format-selector'), 'select', 0) as HTMLSelectElement);
    const formatIndex = formatSelector.selectedIndex;
    const video = mediaInstance.media;

    updateURLParam(seriesID, epIndex, formatIndex);

    sendServerRequest('format_switch.php', {
        callback: function (response: string) {
            const currentTime = video.currentTime;
            const paused = video.paused;

            let parsedResponse: CDNCredentials.CDNCredentials;
            try {
                parsedResponse = JSON.parse(response);
                CDNCredentials.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            const url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + formatSelector.value + '].m3u8'), parsedResponse);
            addVideoNode(url, mediaInstance, { currentTime: currentTime, play: !paused });
        },
        content: "token=" + epInfo.authentication_token + "&format=" + formatIndex,
        logoutParam: getLogoutParam(seriesID, epIndex)
    });
}

function addVideoNode(
    url: string,
    mediaInstance: VideojsModInstance,
    options: { currentTime?: number, play?: boolean }
) {

    destroyAll([mediaInstance]);

    const videoMedia = mediaInstance.media;
    videoMedia.title = getTitle();

    function videoReady() {
        if (options.currentTime !== undefined) {
            videoMedia.currentTime = options.currentTime;
        }

        if (options.play) {
            mediaInstance.play();
        }
    }

    if (browser.USE_MSE) {

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

            hls.on(Hls.Events.ERROR, function (_, data) {
                if (data.fatal) {
                    showPlaybackError(data.details);
                    addClass(mediaHolder, 'hidden');
                    destroyAll([mediaInstance]);
                }
            });
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                videoReady();
            });

            mediaInstance.attachHls(Hls, hls, url);
        }).catch((e) => {
            showMessage(moduleImportError(e));
            return;
        });
    } else if (browser.NATIVE_HLS) {
        addEventListener(videoMedia, 'error', function () {
            showPlaybackError();
            addClass(mediaHolder, 'hidden');
            destroyAll([mediaInstance]);
        });
        addEventListener(videoMedia, 'loadedmetadata', function () {
            videoReady();
        });
        mediaInstance.attachNative(url);
    }
}

function displayChapters(chapters: BangumiInfo.Chapters, mediaInstance: VideojsModInstance) {
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
                if (index == chapters.length - 1) {
                    setClass(chapterElement, 'current-chapter');
                } else if (currentTime < chapters[index + 1]![1]) {
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