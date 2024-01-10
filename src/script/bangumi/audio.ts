import {
    encodeCFURIComponent,
} from '../module/common/pure';
import {
    addEventListener,
    getById,
    addClass,
    getTitle,
    appendChild,
    prependChild,
    createDivElement,
    createParagraphElement,
    createSpanElement,
    createBRElement,
    appendText,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import type { AudioEPInfo, AudioFile } from '../module/type/BangumiInfo';

import {
    IS_FIREFOX,
    MSE,
    NATIVE_HLS,
    CAN_PLAY_ALAC,
    CAN_PLAY_FLAC,
    audioCanPlay,
    canPlay,
} from '../module/browser';
import type { Player as PlayerType } from '../module/player/player';
import type { HlsPlayer as HlsPlayerType } from '../module/player/hls_player';

import { parseCharacters } from './helper';
import {
    showCodecCompatibilityError, showHLSCompatibilityError, incompatibleTitle, incompatibleSuffix, buildDownloadAccordion, showPlayerError, showTextErrorMessage
} from './media_helper';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid } from '../module/global';
import { hlsPlayerImportPromise, nativePlayerImportPromise } from './import_promise';
import { SHARED_VAR_IDX_CONTENT_CONTAINER, SHARED_VAR_IDX_MEDIA_HOLDER, getSharedElement } from './shared_var';

let currentPgid: unknown;

let seriesID: string;
let epIndex: number;
let epInfo: AudioEPInfo;
let baseURL: string;

let createMediaSessionPromise: Promise<MediaSessionInfo>;

let audioReadyCounter: number;
let error: boolean;
const mediaInstances: Array<PlayerType> = [];

export default function (
    _seriesID: string,
    _epIndex: number,
    _epInfo: AudioEPInfo,
    _baseURL: string,
    _createMediaSessionPromise: Promise<MediaSessionInfo>
) {
    currentPgid = pgid;

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    createMediaSessionPromise = _createMediaSessionPromise;

    audioReadyCounter = 0;
    error = false;

    const audioEPInfo = epInfo as AudioEPInfo;

    addAlbumInfo();
    createMediaSessionPromise.then((mediaSessionInfo) => {
        if (currentPgid !== pgid) {
            return;
        }
        appendChild(getSharedElement(SHARED_VAR_IDX_CONTENT_CONTAINER), buildDownloadAccordion(mediaSessionInfo.credential, seriesID, epIndex, null)[0]);
    });

    if (!MSE && !NATIVE_HLS) {
        showHLSCompatibilityError();
        return;
    }

    for (let i = 0; i < audioEPInfo.files.length; i++) {
        addAudioNode(i);
    }
}

async function addAudioNode(index: number) {
    if (error) {
        return;
    }

    const mediaHolder = getSharedElement(SHARED_VAR_IDX_MEDIA_HOLDER);

    const audioEPInfo = epInfo as AudioEPInfo;
    const file = audioEPInfo.files[index] as AudioFile;

    const FLAC_FALLBACK = (file.flac_fallback && !CAN_PLAY_ALAC);

    appendChild(mediaHolder, getAudioSubtitleNode(file, FLAC_FALLBACK));

    const IS_FLAC = (file.format.toLowerCase() === 'flac' || FLAC_FALLBACK);

    const IS_MP3 = file.format.toLowerCase() === 'mp3';
    const CAN_PLAY_MP3 = audioCanPlay('mp3', NATIVE_HLS) || canPlay('audio', 'mpeg', '', NATIVE_HLS); // mp3: Firefox; mpeg: Safari and Chrome
    if ((IS_FLAC && !CAN_PLAY_FLAC) || (IS_MP3 && !CAN_PLAY_MP3)) { // ALAC has already fallen back to FLAC if not supported.
        showCodecCompatibilityError();
        error = true;
        return;
    }

    const playerContainer = createDivElement();
    appendChild(mediaHolder, playerContainer);
    const url = baseURL + encodeCFURIComponent('_MASTER_' + file.file_name + (FLAC_FALLBACK ? '[FLAC]' : '') + '.m3u8');

    if (NATIVE_HLS) {
        let Player: typeof PlayerType;
        try {
            await createMediaSessionPromise;
            Player = (await nativePlayerImportPromise).Player;
        } catch (e) {
            if (currentPgid === pgid) {
                showMessage(moduleImportError(e));
            }
            throw e;
        }

        if (currentPgid !== pgid) {
            return;
        }

        const audioInstance = new Player(playerContainer, {
            audio: true,
        });
        audioInstance.load(url, {
            onerror: function (errorCode: number | null) {
                showPlayerError(errorCode);
                destroyAll();
            },
        });
        mediaInstances[index] = audioInstance;
        setMediaTitle(audioInstance);
        audioReadyCounter++;
        if (audioReadyCounter === audioEPInfo.files.length) {
            audioReady();
        }
    } else {
        let HlsPlayer: typeof HlsPlayerType;
        try {
            await createMediaSessionPromise;
            HlsPlayer = (await hlsPlayerImportPromise).HlsPlayer;
        } catch (e) {
            if (currentPgid === pgid) {
                showMessage(moduleImportError(e));
            }
            throw e;
        }

        if (currentPgid !== pgid) {
            return;
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
            debug: DEVELOPMENT,
            xhrSetup: function (xhr: XMLHttpRequest) {
                xhr.withCredentials = true;
            }
        };
        const audioInstance = new HlsPlayer(playerContainer, configHls, {
            audio: true,
        });
        audioInstance.load(url, {
            onerror: function (errorCode: number | null) {
                if (IS_FIREFOX && parseInt(file.samplerate) > 48000) { //Firefox has problem playing Hi-res audio
                    showTextErrorMessage(incompatibleTitle, 'Firefoxはハイレゾ音源を再生できません。' + incompatibleSuffix);
                } else {
                    showPlayerError(errorCode);
                }
                destroyAll();
            },
        });
        mediaInstances[index] = audioInstance;
        setMediaTitle(audioInstance);
        audioReadyCounter++;
        if (audioReadyCounter === audioEPInfo.files.length) {
            audioReady();
        }
    }

    function setMediaTitle(audioInstance: PlayerType) {
        audioInstance.media.title = (file.title === '' ? '' : (parseCharacters(file.title) + ' | ')) + getTitle();
    }
}

function addAlbumInfo() {
    const albumInfo = (epInfo as AudioEPInfo).album_info;
    if (albumInfo.album_title !== '') {
        const albumTitleElem = createParagraphElement();
        addClass(albumTitleElem, 'sub-title');
        addClass(albumTitleElem, 'center-align');
        albumTitleElem.innerHTML = albumInfo.album_title; // Album title is in HTML syntax.
        const contentContainer = getSharedElement(SHARED_VAR_IDX_CONTENT_CONTAINER);
        if (albumInfo.album_artist !== '') {
            const albumArtist = createParagraphElement();
            addClass(albumArtist, 'artist');
            addClass(albumArtist, 'center-align');
            appendText(albumArtist, albumInfo.album_artist);
            prependChild(contentContainer, albumArtist);
        }
        prependChild(contentContainer, albumTitleElem);
    } else if (albumInfo.album_artist !== '') {
        const titleElem = getById('title');
        const artistElem = createSpanElement();
        addClass(artistElem, 'artist');
        appendChild(artistElem, createBRElement());
        appendText(artistElem, albumInfo.album_artist);
        appendChild(titleElem, artistElem);
    }
}

function getAudioSubtitleNode(file: AudioFile, FLAC_FALLBACK: boolean) {
    const subtitle = createParagraphElement();
    addClass(subtitle, 'sub-title');

    //subtitle
    if (file.title !== '') {
        appendText(subtitle, file.title);
        if (file.artist !== '') {
            const artist = createSpanElement();
            addClass(artist, 'artist');
            appendText(artist, '／' + file.artist);
            appendChild(subtitle, artist);
        }
    }

    //format
    if (file.format !== '') {
        if (file.title !== '') {
            appendChild(subtitle, createBRElement());
        }

        const format = createSpanElement();
        addClass(format, 'format');
        appendText(format, FLAC_FALLBACK ? 'FLAC' : file.format);

        const samplerate = file.samplerate;
        if (samplerate !== '') {
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
            appendText(format, ' ' + samplerateText);

            const bitdepth = file.bitdepth;
            if (bitdepth !== '') {
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
                if (bitdepthText === '32bit' && FLAC_FALLBACK) {
                    bitdepthText = '24bit';
                }
                appendText(format, '/' + bitdepthText);
            }
        }

        appendChild(subtitle, format);
    }

    return subtitle;
}

function audioReady() {
    function pauseAll(currentIndex: number) {
        mediaInstances.forEach((mediaInstance, index) => {
            if (index !== currentIndex) {
                mediaInstance.pause();
            }
        });
    }

    mediaInstances.forEach((instance, index) => {
        addEventListener(instance.media, 'play', () => { // The media play event doesn't need to be handled separately since it catches all play events.
            pauseAll(index);
        });
    });
}

function destroyAll() {
    currentPgid = null;
    let mediaInstance = mediaInstances.pop();
    while (mediaInstance !== undefined) {
        mediaInstance.destroy();
        mediaInstance = mediaInstances.pop();
    }
}

export function offload() {
    destroyAll();
}