import { encodeCloudfrontURIComponent } from '../module/string/uri/cloudfront/encode_component';
import { prependChild } from '../module/dom/node/prepend_child';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { appendText } from '../module/dom/element/text/append';
import { createBRElement } from '../module/dom/element/br/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { addEventListener } from '../module/event_listener/add';
import { getTitle } from '../module/dom/document/title/get';
import { FileInfoKey, type AudioFileInfo, type AudioFile, AudioFileKey, AlbumInfoKey } from '../module/type/EPInfo';
import { MSE_SUPPORTED } from '../module/browser/mse/supported';
import { NATIVE_HLS_SUPPORTED } from '../module/browser/native_hls_supported';
import { CAN_PLAY_FLAC } from '../module/browser/can_play/codec/flac';
import { CAN_PLAY_ALAC } from '../module/browser/can_play/codec/alac';
import { audioCanPlay } from '../module/browser/can_play/audio';
import { canPlay } from '../module/browser/can_play';
import type { Player as PlayerType } from '../module/player/player';
import { parseCharacters } from './helper';
import { showCodecCompatibilityError, showHLSCompatibilityError, incompatibleTitle, buildDownloadAccordion, showPlayerError, showErrorMessage } from './media_helper';
import { MediaSessionInfoKey, type MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { addOffloadCallback } from '../module/global/offload';
import { pgid } from '../module/global/pgid';
import { hlsPlayerImportPromise, nativePlayerImportPromise } from './media_import_promise';
import { SharedElement, getSharedElement } from './shared_var';
import * as styles from '../../css/bangumi.module.scss';
import { PlayerKey } from '../module/player/player_key';
import { mediaIncompatibleSuffix } from '../module/text/media/incompatible_suffix';
import { IS_GECKO } from '../module/browser/is_gecko';

let currentPgid: unknown;

let seriesID: string;
let epIndex: number;
let fileInfo: AudioFileInfo;
let baseURL: string;

let createMediaSessionPromise: Promise<MediaSessionInfo>;

let audioReadyCounter: number;
const mediaInstances: PlayerType[] = [];

export default function (
    _seriesID: string,
    _epIndex: number,
    _fileInfo: AudioFileInfo,
    _baseURL: string,
    _createMediaSessionPromise: Promise<MediaSessionInfo>,
    seriesTitle: string,
) {
    currentPgid = pgid;

    seriesID = _seriesID;
    epIndex = _epIndex;
    fileInfo = _fileInfo;
    baseURL = _baseURL;
    createMediaSessionPromise = _createMediaSessionPromise;

    audioReadyCounter = 0;

    addAlbumInfo(seriesTitle);
    createMediaSessionPromise.then((mediaSessionInfo) => {
        if (currentPgid !== pgid) {
            return;
        }
        appendChild(getSharedElement(SharedElement.CONTENT_CONTAINER), buildDownloadAccordion(mediaSessionInfo[MediaSessionInfoKey.CREDENTIAL], seriesID, epIndex, null)[0]);
    });

    if (!MSE_SUPPORTED && !NATIVE_HLS_SUPPORTED) {
        showHLSCompatibilityError();
        return;
    }

    addOffloadCallback(destroyAll);
    const container = createDivElement();
    const addAudioNodePromises = [];
    for (const file of fileInfo[FileInfoKey.FILES]) {
        addAudioNodePromises.push(addAudioNode(container, file));
    }
    Promise.all(addAudioNodePromises).then(() => {
        if (currentPgid === pgid) {
            replaceChildren(getSharedElement(SharedElement.MEDIA_HOLDER), container);
        }
    });
}

async function addAudioNode(container: HTMLDivElement, file: AudioFile) {
    if (currentPgid !== pgid) {
        return;
    }

    const audioFileInfo = fileInfo;

    const FLAC_FALLBACK = (file[AudioFileKey.FLAC_FALLBACK] === true && !CAN_PLAY_ALAC);
    appendChild(container, getAudioSubtitleNode(file, FLAC_FALLBACK));

    const formatLower = file[AudioFileKey.FORMAT]?.toLowerCase();
    const IS_FLAC = (formatLower === 'flac' || FLAC_FALLBACK);
    const IS_MP3 = formatLower === 'mp3';
    const CAN_PLAY_MP3 = audioCanPlay('mp3') || canPlay('audio', 'mpeg', ''); // mp3: Firefox; mpeg: Safari and Chrome
    if ((IS_FLAC && !CAN_PLAY_FLAC) || (IS_MP3 && !CAN_PLAY_MP3)) { // ALAC has already fallen back to FLAC if not supported.
        showCodecCompatibilityError();
        destroyAll();
        return;
    }

    const playerContainer = createDivElement();
    addClass(playerContainer, styles.player);
    appendChild(container, playerContainer);
    const url = baseURL + encodeCloudfrontURIComponent('_MASTER_' + file[AudioFileKey.FILE_NAME] + (FLAC_FALLBACK ? '[FLAC]' : '') + '.m3u8');

    if (NATIVE_HLS_SUPPORTED) {
        const Player = (await nativePlayerImportPromise).Player;
        await createMediaSessionPromise;
        if (currentPgid !== pgid) {
            return;
        }

        const audioInstance = new Player(playerContainer, false);
        audioInstance[PlayerKey.LOAD](url, {
            onerror: function (errorCode: number | null) {
                showPlayerError(errorCode);
                destroyAll();
            },
        });
        mediaInstances.push(audioInstance);
        setMediaTitle(audioInstance);
        audioReadyCounter++;
        if (audioReadyCounter === audioFileInfo[FileInfoKey.FILES].length) {
            audioReady();
        }
    } else {
        const HlsPlayer = (await hlsPlayerImportPromise).HlsPlayer;
        await createMediaSessionPromise;
        if (currentPgid !== pgid) {
            return;
        }

        const configHls = { maxBufferLength: 15 };
        const audioInstance = new HlsPlayer(playerContainer, configHls, false);
        audioInstance[PlayerKey.LOAD](url, {
            onerror: function (errorCode: number | null) {
                if (IS_GECKO && file[AudioFileKey.SAMPLERATE] !== undefined && parseInt(file[AudioFileKey.SAMPLERATE]) > 48000) { // Firefox has problem playing Hi-res audio
                    showErrorMessage(incompatibleTitle, 'Firefoxまたはその派生ブラウザはハイレゾ音源を再生できません。' + mediaIncompatibleSuffix);
                } else {
                    showPlayerError(errorCode);
                }
                destroyAll();
            },
        });
        mediaInstances.push(audioInstance);
        setMediaTitle(audioInstance);
        audioReadyCounter++;
        if (audioReadyCounter === audioFileInfo[FileInfoKey.FILES].length) {
            audioReady();
        }
    }

    function setMediaTitle(audioInstance: PlayerType) {
        audioInstance[PlayerKey.MEDIA].title = (file[AudioFileKey.TITLE] === undefined ? '' : (parseCharacters(file[AudioFileKey.TITLE]) + ' | ')) + getTitle();
    }
}

function addAlbumInfo(seriesTitle: string) {
    const { [AlbumInfoKey.TITLE]: title, [AlbumInfoKey.ARTIST]: artist } = fileInfo[FileInfoKey.ALBUM_INFO];
    if (title !== undefined || artist !== undefined) {
        const titleElem = createParagraphElement();
        addClass(titleElem, styles.subTitle, styles.centerAlign);
        titleElem.innerHTML = title ?? seriesTitle; // Album title is in HTML syntax.
        const contentContainer = getSharedElement(SharedElement.CONTENT_CONTAINER);
        if (artist !== undefined) {
            const artistElem = createParagraphElement(artist);
            addClass(artistElem, styles.artist, styles.centerAlign);
            prependChild(contentContainer, artistElem);
        }
        prependChild(contentContainer, titleElem);
    }
}

function getAudioSubtitleNode(file: AudioFile, FLAC_FALLBACK: boolean) {
    const subtitle = createParagraphElement();
    addClass(subtitle, styles.subTitle);

    // subtitle
    if (file[AudioFileKey.TITLE] !== undefined) {
        appendText(subtitle, file[AudioFileKey.TITLE]);
        if (file[AudioFileKey.ARTIST] !== undefined) {
            const artist = createSpanElement('／' + file[AudioFileKey.ARTIST]);
            addClass(artist, styles.artist);
            appendChild(subtitle, artist);
        }
    }

    // format
    if (file[AudioFileKey.FORMAT] !== undefined) {
        if (file[AudioFileKey.TITLE] !== undefined) {
            appendChild(subtitle, createBRElement());
        }

        const format = createSpanElement(FLAC_FALLBACK ? 'FLAC' : file[AudioFileKey.FORMAT]);
        addClass(format, styles.subTitleFormat);

        const samplerate = file[AudioFileKey.SAMPLERATE];
        if (samplerate !== undefined) {
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

            const bitdepth = file[AudioFileKey.BITDEPTH];
            if (bitdepth !== undefined) {
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
                mediaInstance[PlayerKey.PAUSE]();
            }
        });
    }

    mediaInstances.forEach((instance, index) => {
        addEventListener(instance[PlayerKey.MEDIA], 'play', () => { // The media play event doesn't need to be handled separately since it catches all play events.
            pauseAll(index);
        });
    });
}

function destroyAll() {
    currentPgid = null; // It's necessary to reset pgid as it also helps track if any error occurs.
    let mediaInstance = mediaInstances.pop();
    while (mediaInstance !== undefined) {
        mediaInstance[PlayerKey.DESTROY]();
        mediaInstance = mediaInstances.pop();
    }
}
