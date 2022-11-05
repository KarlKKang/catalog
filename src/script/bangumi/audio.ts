import {
    concatenateSignedURL,
    encodeCFURIComponent,
} from '../module/main';
import {
    addEventListener,
    getById,
    createElement,
    addClass,
    getTitle,
    appendChild,
    prependChild,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import type { AudioEPInfo, AudioFile } from '../module/type/BangumiInfo';

import {
    IS_FIREFOX,
    IS_CHROMIUM,
    USE_MSE,
    NATIVE_HLS,
    CAN_PLAY_ALAC,
    CAN_PLAY_FLAC,
    CAN_PLAY_MP3,
} from '../module/browser';
import { default as videojs } from 'video.js';
import { Player, HlsPlayer, VideojsPlayer } from '../module/player';

import { parseCharacters } from './helper';
import { showErrorMessage, showMediaMessage, showCodecCompatibilityError, showHLSCompatibilityError, showPlaybackError, incompatibleTitle, incompatibleSuffix, getDownloadAccordion } from './media_helper';
import type { HlsImportPromise } from './get_import_promises';

let seriesID: string;
let epIndex: number;
let epInfo: AudioEPInfo;
let baseURL: string;
let mediaHolder: HTMLElement;
let debug: boolean;

let audioReadyCounter = 0;
const mediaInstances: Array<Player> = [];
let hlsImportPromise: HlsImportPromise;

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: AudioEPInfo,
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

    const audioEPInfo = epInfo as AudioEPInfo;

    addAlbumInfo();
    appendChild(getById('content'), getDownloadAccordion(epInfo.authentication_token, seriesID, epIndex));

    if (!USE_MSE && !NATIVE_HLS) {
        showHLSCompatibilityError();
        return;
    }

    for (let i = 0; i < audioEPInfo.files.length; i++) {
        if (!addAudioNode(i)) {
            return;
        }
    }
}

function addAudioNode(index: number) {
    const audioEPInfo = epInfo as AudioEPInfo;
    const file = audioEPInfo.files[index] as AudioFile;

    const credentials = audioEPInfo.cdn_credentials;

    const configVideoJSControl = {
        controls: true,
        autoplay: false,
        fluid: true,
        aspectRatio: '1:0',
        controlBar: {
            fullscreenToggle: false,
            pictureInPictureToggle: false
        }
    } as const;

    const configHls = {
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

    const audioNode = createElement('audio');
    audioNode.id = 'track' + index;

    addClass(audioNode, 'vjs-default-skin');
    addClass(audioNode, 'video-js');
    audioNode.lang = 'en';

    const FLAC_FALLBACK = (file.flac_fallback && !CAN_PLAY_ALAC);

    appendChild(mediaHolder, getAudioSubtitleNode(file, FLAC_FALLBACK));
    appendChild(mediaHolder, audioNode);

    const IS_FLAC = (file.format.toLowerCase() == 'flac' || FLAC_FALLBACK);
    const USE_VIDEOJS = USE_MSE && IS_FLAC;

    const IS_MP3 = file.format.toLowerCase() == 'mp3';

    if ((IS_FLAC && !CAN_PLAY_FLAC) || (IS_MP3 && !CAN_PLAY_MP3)) { //ALAC has already fallen back to FLAC if not supported.
        showCodecCompatibilityError();
        return false;
    }

    const videoJSControl = videojs(audioNode, configVideoJSControl, function () {
        const url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + file.file_name + (FLAC_FALLBACK ? '[FLAC]' : '') + '.m3u8'), credentials, baseURL + '_MASTER_*.m3u8');

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
            const videoJSMediaNode = createElement('audio') as HTMLAudioElement;
            videoJSMediaNode.style.display = 'none';
            appendChild(mediaHolder, videoJSMediaNode);

            const videoJSMedia = videojs(videoJSMediaNode, configVideoJSMedia, function () {
                const audioInstance = new VideojsPlayer(videoJSControl, videoJSMedia, {
                    audio: true,
                    debug: debug
                });
                audioInstance.load(url, {
                    onerror: function () {
                        if (IS_FIREFOX && parseInt(file.samplerate) > 48000) { //Firefox has problem playing Hi-res audio
                            showErrorMessage(incompatibleTitle, 'Firefoxはハイレゾ音源を再生できません。' + incompatibleSuffix);
                        } else {
                            showPlaybackError('Index ' + index + ': ' + 'videojs: ' + JSON.stringify(videoJSMedia.error()));
                        }
                        destroyAll();
                    },
                    onload: function () {
                        audioReadyCounter++;
                        if (audioReadyCounter == audioEPInfo.files.length) {
                            audioReady();
                        }
                    }
                });
                mediaInstances[index] = audioInstance;
                setMediaTitle(audioInstance);
            });
        } else {
            if (USE_MSE) {
                if (IS_CHROMIUM) {
                    showChromiumCompatibilityWarning();
                }
                hlsImportPromise.then(({ default: Hls }) => {
                    const hls = new Hls(configHls);
                    const audioInstance = new HlsPlayer(videoJSControl, hls, Hls, {
                        audio: true,
                        debug: debug
                    });
                    audioInstance.load(url, {
                        onerror: function (_, data) {
                            if (data.fatal) {
                                showPlaybackError('Index ' + index + ': ' + data.details);
                                destroyAll();
                            }
                        },
                        onload: function () {
                            audioReadyCounter++;
                            if (audioReadyCounter == audioEPInfo.files.length) {
                                audioReady();
                            }
                        }
                    });
                    mediaInstances[index] = audioInstance;
                    setMediaTitle(audioInstance);
                }).catch((e) => {
                    showMessage(moduleImportError(e));
                    return;
                });
            } else if (NATIVE_HLS) {
                const audioInstance = new Player(videoJSControl, {
                    audio: true,
                    debug: debug
                });
                audioInstance.load(url, {
                    onerror: function () {
                        showPlaybackError();
                        destroyAll();
                    },
                    onload: function () {
                        audioReadyCounter++;
                        if (audioReadyCounter == audioEPInfo.files.length) {
                            audioReady();
                        }
                    }
                });
                mediaInstances[index] = audioInstance;
                setMediaTitle(audioInstance);
            }
        }
    });

    function setMediaTitle(audioInstance: Player) {
        audioInstance.media.title = ((file.title == '') ? '' : (parseCharacters(file.title) + ' | ')) + getTitle();
    }

    return true;
}

function addAlbumInfo() {
    const contentContainer = getById('content');
    const albumInfo = (epInfo as AudioEPInfo).album_info;
    if (albumInfo.album_title != '') {
        const albumTitleElem = createElement('p');
        addClass(albumTitleElem, 'sub-title');
        addClass(albumTitleElem, 'center-align');
        albumTitleElem.innerHTML = albumInfo.album_title;
        if (albumInfo.album_artist != '') {
            const albumArtist = createElement('p');
            addClass(albumArtist, 'artist');
            addClass(albumArtist, 'center-align');
            albumArtist.innerHTML = albumInfo.album_artist;
            prependChild(contentContainer, albumArtist);
        }
        prependChild(contentContainer, albumTitleElem);
    } else if (albumInfo.album_artist != '') {
        const titleElem = getById('title');
        const artistElem = createElement('span');
        addClass(artistElem, 'artist');
        artistElem.innerHTML = '<br/>' + albumInfo.album_artist;
        appendChild(titleElem, artistElem);
    }
}

function getAudioSubtitleNode(file: AudioFile, FLAC_FALLBACK: boolean) {
    const subtitle = createElement('p');
    addClass(subtitle, 'sub-title');

    //subtitle
    if (file.title != '') {
        subtitle.innerHTML = file.title;

        if (file.artist != '') {
            const artist = createElement('span');
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

        const format = createElement('span');
        addClass(format, 'format');
        format.innerHTML = FLAC_FALLBACK ? 'FLAC' : file.format;

        const samplerate = file.samplerate;
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

            const bitdepth = file.bitdepth;
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
        mediaInstances.forEach(function (mediaInstance, index) {
            if (index !== currentIndex) {
                mediaInstance.pause();
            }
        });
    }
    function playNext(currentIndex: number) {
        if (currentIndex < mediaInstances.length - 1) {
            (mediaInstances[currentIndex + 1] as Player).play();
        }
    }

    mediaInstances.forEach(function (instance, index) {
        const media = instance.media;
        addEventListener(media, 'play', function () {
            pauseAll(index);
        });
        addEventListener(media, 'ended', function () {
            playNext(index);
        });
    });
}

function destroyAll() {
    for (const mediaInstance of mediaInstances) {
        mediaInstance.destroy();
    }
}

let chromiumWarningDisplayed = false;
function showChromiumCompatibilityWarning() {
    if (chromiumWarningDisplayed) {
        return;
    }
    chromiumWarningDisplayed = true;
    showMediaMessage('不具合があります', 'Chromiumベースのブラウザで、MP3ファイルをシークできない問題があります。SafariやFirefoxでお試しいただくか、ファイルをダウンロードしてローカルで再生してください。<br>バグの追跡：<a class="link" href="https://github.com/video-dev/hls.js/issues/4543" target="_blank" rel="noopener noreferrer">https://github.com/video-dev/hls.js/issues/4543</a>', 'orange');
}