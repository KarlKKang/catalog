import {
    encodeCFURIComponent,
} from '../module/common/pure';
import {
    addEventListener,
    addClass,
    getTitle,
    appendChild,
    prependChild,
    createDivElement,
    createParagraphElement,
    createSpanElement,
    createBRElement,
    appendText,
    replaceChildren,
} from '../module/dom';
import { showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
import type { AudioEPInfo, AudioFile } from '../module/type/BangumiInfo';

import {
    IS_FIREFOX,
    MSE_SUPPORTED,
    NATIVE_HLS_SUPPORTED,
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
import { SharedElement, getSharedElement } from './shared_var';
import * as styles from '../../css/bangumi.module.scss';

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
    _createMediaSessionPromise: Promise<MediaSessionInfo>,
    seriesTitle: string,
) {
    currentPgid = pgid;

    seriesID = _seriesID;
    epIndex = _epIndex;
    epInfo = _epInfo;
    baseURL = _baseURL;
    createMediaSessionPromise = _createMediaSessionPromise;

    audioReadyCounter = 0;
    error = false;

    addAlbumInfo(seriesTitle);
    createMediaSessionPromise.then((mediaSessionInfo) => {
        if (currentPgid !== pgid) {
            return;
        }
        appendChild(getSharedElement(SharedElement.CONTENT_CONTAINER), buildDownloadAccordion(mediaSessionInfo.credential, seriesID, epIndex, null)[0]);
    });

    if (!MSE_SUPPORTED && !NATIVE_HLS_SUPPORTED) {
        showHLSCompatibilityError();
        return;
    }

    const container = createDivElement();
    const addAudioNodePromises = [];
    for (const file of epInfo.files) {
        addAudioNodePromises.push(addAudioNode(container, file));
    }
    Promise.all(addAudioNodePromises).then(() => {
        if (currentPgid === pgid) {
            replaceChildren(getSharedElement(SharedElement.MEDIA_HOLDER), container);
        }
    });
}

async function addAudioNode(container: HTMLDivElement, file: AudioFile) {
    if (error) {
        return;
    }

    const audioEPInfo = epInfo;

    const FLAC_FALLBACK = (file.flac_fallback === true && !CAN_PLAY_ALAC);
    appendChild(container, getAudioSubtitleNode(file, FLAC_FALLBACK));

    const formatLower = file.format?.toLowerCase();
    const IS_FLAC = (formatLower === 'flac' || FLAC_FALLBACK);
    const IS_MP3 = formatLower === 'mp3';
    const CAN_PLAY_MP3 = audioCanPlay('mp3') || canPlay('audio', 'mpeg', ''); // mp3: Firefox; mpeg: Safari and Chrome
    if ((IS_FLAC && !CAN_PLAY_FLAC) || (IS_MP3 && !CAN_PLAY_MP3)) { // ALAC has already fallen back to FLAC if not supported.
        showCodecCompatibilityError();
        error = true;
        return;
    }

    const playerContainer = createDivElement();
    addClass(playerContainer, styles.player);
    appendChild(container, playerContainer);
    const url = baseURL + encodeCFURIComponent('_MASTER_' + file.file_name + (FLAC_FALLBACK ? '[FLAC]' : '') + '.m3u8');

    if (!MSE_SUPPORTED) {
        let Player: typeof PlayerType;
        try {
            await createMediaSessionPromise;
            Player = (await nativePlayerImportPromise).Player;
        } catch (e) {
            if (currentPgid === pgid) {
                showMessage(moduleImportError);
            }
            throw e;
        }

        if (currentPgid !== pgid) {
            return;
        }

        const audioInstance = new Player(playerContainer, false);
        audioInstance.load(url, {
            onerror: function (errorCode: number | null) {
                showPlayerError(errorCode);
                destroyAll();
            },
        });
        mediaInstances.push(audioInstance);
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
                showMessage(moduleImportError);
            }
            throw e;
        }

        if (currentPgid !== pgid) {
            return;
        }

        const configHls = { maxBufferLength: 15 };
        const audioInstance = new HlsPlayer(playerContainer, configHls, false);
        audioInstance.load(url, {
            onerror: function (errorCode: number | null) {
                if (IS_FIREFOX && file.samplerate !== undefined && parseInt(file.samplerate) > 48000) { //Firefox has problem playing Hi-res audio
                    showTextErrorMessage(incompatibleTitle, 'Firefoxはハイレゾ音源を再生できません。' + incompatibleSuffix);
                } else {
                    showPlayerError(errorCode);
                }
                destroyAll();
            },
        });
        mediaInstances.push(audioInstance);
        setMediaTitle(audioInstance);
        audioReadyCounter++;
        if (audioReadyCounter === audioEPInfo.files.length) {
            audioReady();
        }
    }

    function setMediaTitle(audioInstance: PlayerType) {
        audioInstance.media.title = (file.title === undefined ? '' : (parseCharacters(file.title) + ' | ')) + getTitle();
    }
}

function addAlbumInfo(seriesTitle: string) {
    const { title, artist } = epInfo.album_info;
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

    //subtitle
    if (file.title !== undefined) {
        appendText(subtitle, file.title);
        if (file.artist !== undefined) {
            const artist = createSpanElement('／' + file.artist);
            addClass(artist, styles.artist);
            appendChild(subtitle, artist);
        }
    }

    //format
    if (file.format !== undefined) {
        if (file.title !== undefined) {
            appendChild(subtitle, createBRElement());
        }

        const format = createSpanElement(FLAC_FALLBACK ? 'FLAC' : file.format);
        addClass(format, styles.subTitleFormat);

        const samplerate = file.samplerate;
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

            const bitdepth = file.bitdepth;
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