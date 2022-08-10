import {
    concatenateSignedURL,
    encodeCFURIComponent,
} from '../module/main';
import {
    addEventListener,
    getById,
    createElement,
    addClass,
    insertBefore,
    getTitle,
    appendChild,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import type { BangumiInfo } from '../module/type';

import { videojs, browser, videojsMod } from '../module/player';
import type { VideojsModInstance } from '../module/player';

import { parseCharacters } from './helper';
import { showMediaMessage, showCodecCompatibilityError, showHLSCompatibilityError, showPlaybackError, incompatibleTitle, incompatibleSuffix, destroyAll, getDownloadAccordion } from './media_helper';

var seriesID: string;
var epIndex: number;
var epInfo: BangumiInfo.AudioEPInfo;
var baseURL: string;
var mediaHolder: HTMLElement;
var contentContainer: HTMLElement;
var debug: boolean;

var audioReadyCounter = 0;
var mediaInstances: Array<VideojsModInstance> = [];
var hlsImportPromise = import(
    /* webpackExports: ["default"] */
    'hls.js'
);

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: BangumiInfo.AudioEPInfo,
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

    let audioEPInfo = epInfo as BangumiInfo.AudioEPInfo;

    addAlbumInfo();

    if (browser.IS_DESKTOP) {
        appendChild(contentContainer, getDownloadAccordion(epInfo.authentication_token, seriesID, epIndex));
    }

    if (!browser.USE_MSE && !browser.NATIVE_HLS) {
        showHLSCompatibilityError();
        addClass(mediaHolder, 'hidden');
        return;
    }

    for (var i = 0; i < audioEPInfo.files.length; i++) {
        if (!addAudioNode(i)) {
            return;
        }
    }
}

function addAudioNode(index: number) {
    let audioEPInfo = epInfo as BangumiInfo.AudioEPInfo;
    let file = audioEPInfo.files[index] as BangumiInfo.AudioFile;

    let credentials = audioEPInfo.cdn_credentials;

    const configVideoJSControl = {
        controls: true,
        autoplay: false,
        fluid: true,
        aspectRatio: "1:0",
        controlBar: {
            fullscreenToggle: false,
            pictureInPictureToggle: false
        }
    } as const;

    let configHls = {
        enableWebVTT: false,
        enableIMSC1: false,
        enableCEA708Captions: false,
        lowLatencyMode: false,
        enableWorker: false,
        maxFragLookUpTolerance: 0.0,
        testBandwidth: false,
        maxBufferSize: 0,
        maxBufferHole: 0,
        debug: false,
        xhrSetup: function (xhr: XMLHttpRequest) {
            xhr.withCredentials = true;
        }
    };

    let audioNode = createElement('audio');
    audioNode.id = 'track' + index;

    addClass(audioNode, "vjs-default-skin");
    addClass(audioNode, "video-js");
    audioNode.lang = 'en';

    const FLAC_FALLBACK = (file.flac_fallback && !browser.CAN_PLAY_ALAC);

    appendChild(mediaHolder, getAudioSubtitleNode(file, FLAC_FALLBACK));
    appendChild(mediaHolder, audioNode);

    const IS_FLAC = (file.format.toLowerCase() == 'flac' || FLAC_FALLBACK);
    const USE_VIDEOJS = browser.USE_MSE && IS_FLAC;

    const IS_MP3 = file.format.toLowerCase() == 'mp3';

    if ((IS_FLAC && !browser.CAN_PLAY_FLAC) || (IS_MP3 && !browser.CAN_PLAY_MP3)) { //ALAC has already fallen back to FLAC if not supported.
        showCodecCompatibilityError(browser.IS_LINUX);
        addClass(mediaHolder, 'hidden');
        return false;
    }

    let videoJSControl = videojs(audioNode, configVideoJSControl, function () {
        let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + file.file_name + (FLAC_FALLBACK ? '[FLAC]' : '') + '.m3u8'), credentials, baseURL + '_MASTER_*.m3u8');

        if (USE_VIDEOJS) {
            const configVideoJSMedia = {
                controls: false,
                autoplay: false,
                html5: {
                    vhs: {
                        overrideNative: true,
                        withCredentials: true
                    },
                    nativeAudioTracks: false,
                    //nativeVideoTracks: false
                },
            } as const;
            let videoJSMediaNode = createElement('audio') as HTMLAudioElement;
            videoJSMediaNode.style.display = 'none';
            appendChild(mediaHolder, videoJSMediaNode);

            let videoJSMedia = videojs(videoJSMediaNode, configVideoJSMedia, function () {

                let audioInstance = videojsMod(videoJSControl, {
                    videojsMediaOverrideInstance: videoJSMedia,
                    audio: true,
                    debug: debug
                });

                mediaInstances[index] = audioInstance;


                setMediaTitle(audioInstance);

                audioReadyCounter++;
                if (audioReadyCounter == audioEPInfo.files.length) {
                    audioReady();
                }

                videoJSMedia.on('error', function () {
                    if (browser.IS_FIREFOX && parseInt(file.samplerate) > 48000) { //Firefox has problem playing Hi-res audio
                        showMediaMessage(incompatibleTitle, '<p>Firefoxはハイレゾ音源を再生できません。' + incompatibleSuffix + '</p>', 'red');
                    } else {
                        showPlaybackError('Index ' + index + ': ' + 'videojs: ' + JSON.stringify(videoJSMedia.error()));
                        addClass(mediaHolder, 'hidden');
                        destroyAll(mediaInstances);
                    }
                });

                audioInstance.attachVideojs(url);
            });
        } else {
            let audioInstance = videojsMod(videoJSControl, { audio: true, debug: debug });
            mediaInstances[index] = audioInstance;
            setMediaTitle(audioInstance);
            if (browser.USE_MSE) {
                if (browser.IS_CHROMIUM) {
                    showMediaMessage('不具合があります', '<p>Chromiumベースのブラウザで、MP3ファイルをシークできない問題があります。SafariやFirefoxでお試しいただくか、ファイルをダウンロードしてローカルで再生してください。<br>バグの追跡：<a class="link" href="https://github.com/video-dev/hls.js/issues/4543" target="_blank" rel="noopener noreferrer">https://github.com/video-dev/hls.js/issues/4543</a></p>', 'orange');
                }
                hlsImportPromise.then(({ default: Hls }) => {
                    let hls = new Hls(configHls);
                    hls.on(Hls.Events.ERROR, function (_, data) {
                        if (data.fatal) {
                            showPlaybackError('Index ' + index + ': ' + data.details);
                            addClass(mediaHolder, 'hidden');
                            destroyAll(mediaInstances);
                        }
                    });
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        audioReadyCounter++;
                        if (audioReadyCounter == audioEPInfo.files.length) {
                            audioReady();
                        }
                    });
                    audioInstance.attachHls(Hls, hls, url);
                }).catch((e) => {
                    showMessage(moduleImportError(e));
                    return;
                });;
            } else if (browser.NATIVE_HLS) {
                let audioMedia = audioInstance.media;

                addEventListener(audioMedia, 'error', function () {
                    showPlaybackError();
                    addClass(mediaHolder, 'hidden');
                    destroyAll(mediaInstances);
                });
                addEventListener(audioMedia, 'loadedmetadata', function () {
                    audioReadyCounter++;
                    if (audioReadyCounter == audioEPInfo.files.length) {
                        audioReady();
                    }
                });
                audioInstance.attachNative(url);
            }
        }
    });

    function setMediaTitle(audioInstance: VideojsModInstance) {
        audioInstance.media.title = ((file.title == '') ? '' : (parseCharacters(file.title) + ' | ')) + getTitle();
    }

    return true;
}

function addAlbumInfo() {
    let albumInfo = (epInfo as BangumiInfo.AudioEPInfo).album_info;
    if (albumInfo.album_title != '') {
        let albumTitleElem = createElement('p');
        addClass(albumTitleElem, 'sub-title');
        addClass(albumTitleElem, 'center-align');
        albumTitleElem.innerHTML = albumInfo.album_title;
        insertBefore(albumTitleElem, getById('message'));
        if (albumInfo.album_artist != '') {
            let albumArtist = createElement('p');
            addClass(albumArtist, 'artist');
            addClass(albumArtist, 'center-align');
            albumArtist.innerHTML = albumInfo.album_artist;
            insertBefore(albumArtist, getById('message'));
        }
    } else if (albumInfo.album_artist != '') {
        let titleElem = getById('title');
        let artistElem = createElement('span');
        addClass(artistElem, 'artist');
        artistElem.innerHTML = '<br/>' + albumInfo.album_artist;
        appendChild(titleElem, artistElem);
    }
}

function getAudioSubtitleNode(file: BangumiInfo.AudioFile, FLAC_FALLBACK: boolean) {
    let subtitle = createElement('p');
    addClass(subtitle, 'sub-title');

    //subtitle
    if (file.title != '') {
        subtitle.innerHTML = file.title;

        if (file.artist != '') {
            let artist = createElement('span');
            addClass(artist, 'artist');
            artist.innerHTML = '／' + file.artist;
            appendChild(subtitle, artist);
        }
    }

    //format
    if (file.format != '') {
        if (subtitle.innerHTML != '') {
            subtitle.innerHTML += '<br>';
        }

        let format = createElement('span');
        addClass(format, 'format');
        format.innerHTML = FLAC_FALLBACK ? 'FLAC' : file.format;

        let samplerate = file.samplerate;
        if (samplerate != '') {
            let samplerateText = samplerate;
            switch (samplerate) {
                case '44100':
                    samplerateText = '44.1kHz';
                    break;
                case '48000':
                    samplerateText = '48.0kHz';
                    break;
                case '96000':
                    samplerateText = '96.0kHz';
                    break;
                case '88200':
                    samplerateText = '88.2kHz';
                    break;
                case '192000':
                    samplerateText = '192.0kHz';
                    break;
            }
            format.innerHTML += ' ' + samplerateText;

            let bitdepth = file.bitdepth;
            if (bitdepth != '') {
                let bitdepthText = bitdepth;
                switch (bitdepth) {
                    case '16':
                        bitdepthText = '16bit';
                        break;
                    case '24':
                        bitdepthText = '24bit';
                        break;
                    case '32':
                        bitdepthText = '32bit';
                        break;
                }
                if (bitdepthText == '32bit' && FLAC_FALLBACK) {
                    bitdepthText = '24bit';
                }
                format.innerHTML += '/' + bitdepthText;
            }
        }

        appendChild(subtitle, format);
    }

    return subtitle;
}

function audioReady() {
    function pauseAll(currentIndex: number) {
        for (var j = 0; j < mediaInstances.length; j++) {
            if (j != currentIndex) {
                (mediaInstances[j] as VideojsModInstance).pause();
            }
        }
    }
    function playNext(currentIndex: number) {
        if (currentIndex < mediaInstances.length - 1) {
            (mediaInstances[currentIndex + 1] as VideojsModInstance).play();
        }
    }

    mediaInstances.forEach(function (instance, index) {
        let media = instance.media;
        addEventListener(media, 'play', function () {
            pauseAll(index);
        });
        addEventListener(media, 'ended', function () {
            playNext(index);
        });
    });
}