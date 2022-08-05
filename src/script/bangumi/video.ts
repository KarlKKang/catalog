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
import * as message from '../module/message';
import { CDNCredentials } from '../module/type';
import type { BangumiInfo } from '../module/type';

import { videojs, browser, videojsMod } from '../module/player';
import type { VideojsModInstance } from '../module/player';

import { updateURLParam, getLogoutParam, getFormatIndex } from './helper';
import { destroyAll, showPlaybackError, showHLSCompatibilityError, showCodecCompatibilityError, getDownloadAccordion, addAccordionEvent } from './media_helper';

var seriesID: string;
var epIndex: number;
var epInfo: BangumiInfo.VideoEPInfo;
var baseURL: string;
var mediaHolder: HTMLElement;
var contentContainer: HTMLElement;
var debug: boolean;

var hlsImportPromise = import(
    /* webpackExports: ["default"] */
    'hls.js'
);

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: BangumiInfo.VideoEPInfo,
    _baseURL: string,
    _mediaHolder: HTMLElement,
    _contentContainer: HTMLElement,
    _debug: boolean
) {

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    mediaHolder = _mediaHolder;
    contentContainer = _contentContainer;
    debug = _debug;

    addClass(mediaHolder, 'video');

    // Title
    if (epInfo.title != '') {
        let title = createElement('p');
        addClass(title, 'sub-title');
        addClass(title, 'center-align');
        title.innerHTML = epInfo.title;
        insertBefore(title, getById('message'));
    }

    // Formats
    let formatIndex = getFormatIndex();
    let formats = epInfo.formats;

    let formatSelector = createElement('div');
    formatSelector.id = 'format-selector';

    let selectMenu = createElement('select') as HTMLSelectElement;

    if (formatIndex >= formats.length) {
        formatIndex = 0;
    }
    updateURLParam(seriesID, epIndex, formatIndex);

    formats.forEach(function (format, index) {
        let option = createElement('option') as HTMLOptionElement;

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

    var videoJS = createElement('video-js');

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

        let mediaInstance = videojsMod(this, { debug: debug });

        addEventListener(selectMenu, "change", function () {
            formatSwitch(mediaInstance);
        });

        let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + selectMenu.value + '].m3u8'), epInfo.cdn_credentials);

        addVideoNode(url, mediaInstance, {/*, currentTime: timestampParam*/ });
        if (epInfo.chapters.length > 0) {
            displayChapters(epInfo.chapters, mediaInstance);
        }
        //updateURLTimestamp();
    });
}

function formatSwitch(mediaInstance: VideojsModInstance) {
    let formatSelector = (getDescendantsByTagAt(getById('format-selector'), 'select', 0) as HTMLSelectElement);
    let formatIndex = formatSelector.selectedIndex;
    let video = mediaInstance.media;

    updateURLParam(seriesID, epIndex, formatIndex);

    sendServerRequest('format_switch.php', {
        callback: function (response: string) {
            let currentTime = video.currentTime;
            let paused = video.paused;

            let parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                CDNCredentials.check(parsedResponse);
            } catch (e) {
                message.show(message.template.param.server.invalidResponse);
                return;
            }
            let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + formatSelector.value + '].m3u8'), parsedResponse as CDNCredentials.CDNCredentials);
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

    let videoMedia = mediaInstance.media;
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

        var config = {
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
            let hls = new Hls(config);

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
            message.show(message.template.param.moduleImportError(e));
            return;
        });;
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
    var accordion = createElement('button');
    addClass(accordion, 'accordion');
    accordion.innerHTML = 'CHAPTERS';

    var accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    var video = mediaInstance.media;

    for (let chapter of chapters) {
        let chapterNode = createElement('p');
        let timestamp = createElement('span');
        let cueText = createTextNode('\xa0\xa0' + chapter[0]);
        let startTime = chapter[1];
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

    var chaptersNode = createElement('div');
    addClass(chaptersNode, 'chapters');
    appendChild(chaptersNode, accordion);
    appendChild(chaptersNode, accordionPanel);
    addAccordionEvent(accordion);
    appendChild(mediaHolder, chaptersNode);

    var updateChapterDisplay = function () {
        var chapterElements = getDescendantsByTag(accordionPanel, 'p');
        var currentTime = video.currentTime;
        chapters.forEach(function (chapter, index) {
            let chapterElement = chapterElements[index] as HTMLElement;
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