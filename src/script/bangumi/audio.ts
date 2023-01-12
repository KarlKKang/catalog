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
    USE_MSE,
    NATIVE_HLS,
    CAN_PLAY_ALAC,
    CAN_PLAY_FLAC,
    CAN_PLAY_MP3,
} from '../module/browser';
import { Player, HlsPlayer, VideojsPlayer } from '../module/player';

import { parseCharacters } from './helper';
import {
    showErrorMessage, showCodecCompatibilityError, showHLSCompatibilityError, showPlaybackError, incompatibleTitle, incompatibleSuffix, getDownloadAccordion
} from './media_helper';
import type { HlsImportPromise, VideojsImportPromise } from './get_import_promises';
import type Hls from 'hls.js';
import type videojs from 'video.js';

let seriesID: string;
let epIndex: number;
let epInfo: AudioEPInfo;
let baseURL: string;
let mediaHolder: HTMLElement;
let debug: boolean;

let audioReadyCounter = 0;
const mediaInstances: Array<Player> = [];
let hlsImportPromise: HlsImportPromise;
let videojsImportPromise: VideojsImportPromise;

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: AudioEPInfo,
    _baseURL: string,
    _mediaHolder: HTMLElement,
    _hlsImportPromise: HlsImportPromise,
    _videojsImportPromise: VideojsImportPromise,
    _debug: boolean
) {

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    mediaHolder = _mediaHolder;
    hlsImportPromise = _hlsImportPromise;
    videojsImportPromise = _videojsImportPromise;
    debug = _debug;

    const audioEPInfo = epInfo as AudioEPInfo;

    addAlbumInfo();
    appendChild(getById('content'), getDownloadAccordion(epInfo.authentication_token, seriesID, epIndex));

    if (!USE_MSE && !NATIVE_HLS) {
        showHLSCompatibilityError();
        return;
    }

    for (let i = 0; i < audioEPInfo.files.length; i++) {
        addAudioNode(i);
    }
}

let error = false;

async function addAudioNode(index: number) {
    if (error) {
        return;
    }

    const audioEPInfo = epInfo as AudioEPInfo;
    const file = audioEPInfo.files[index] as AudioFile;
    const credentials = audioEPInfo.cdn_credentials;

    const FLAC_FALLBACK = (file.flac_fallback && !CAN_PLAY_ALAC);

    appendChild(mediaHolder, getAudioSubtitleNode(file, FLAC_FALLBACK));

    const IS_FLAC = (file.format.toLowerCase() == 'flac' || FLAC_FALLBACK);
    const USE_VIDEOJS = USE_MSE && IS_FLAC;

    const IS_MP3 = file.format.toLowerCase() == 'mp3';

    if ((IS_FLAC && !CAN_PLAY_FLAC) || (IS_MP3 && !CAN_PLAY_MP3)) { //ALAC has already fallen back to FLAC if not supported.
        showCodecCompatibilityError();
        error = true;
        return;
    }

    const playerContainer = createElement('div') as HTMLDivElement;
    appendChild(mediaHolder, playerContainer);
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

        let videojsConstructor: typeof videojs;
        try {
            videojsConstructor = (await videojsImportPromise).default;
        } catch (e) {
            showMessage(moduleImportError(e));
            throw e;
        }

        const audioInstance = new VideojsPlayer(playerContainer, videojsConstructor, configVideoJSMedia, {
            audio: true,
            debug: debug
        });
        audioInstance.load(url, {
            onerror: function () {
                if (IS_FIREFOX && parseInt(file.samplerate) > 48000) { //Firefox has problem playing Hi-res audio
                    showErrorMessage(incompatibleTitle, 'Firefoxはハイレゾ音源を再生できません。' + incompatibleSuffix);
                } else {
                    showPlaybackError('Index ' + index);
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
    } else {
        if (USE_MSE) {
            let hlsConstructor: typeof Hls;
            try {
                hlsConstructor = (await hlsImportPromise).default;
            } catch (e) {
                showMessage(moduleImportError(e));
                throw e;
            }

            const configHls = {
                enableWebVTT: false,
                enableIMSC1: false,
                enableCEA708Captions: false,
                lowLatencyMode: false,
                enableWorker: false,
                maxFragLookUpTolerance: 0.0,
                backBufferLength: 0,
                maxBufferLength: 15,
                maxBufferSize: 0,
                maxBufferHole: 0.5,
                debug: debug,
                xhrSetup: function (xhr: XMLHttpRequest) {
                    xhr.withCredentials = true;
                }
            };
            const audioInstance = new HlsPlayer(playerContainer, hlsConstructor, configHls, {
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
        } else {
            const audioInstance = new Player(playerContainer, {
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

    function setMediaTitle(audioInstance: Player) {
        audioInstance.media.title = ((file.title == '') ? '' : (parseCharacters(file.title) + ' | ')) + getTitle();
    }
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
        format.textContent = FLAC_FALLBACK ? 'FLAC' : file.format;

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
            format.textContent += ' ' + samplerateText;

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
                format.textContent += '/' + bitdepthText;
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