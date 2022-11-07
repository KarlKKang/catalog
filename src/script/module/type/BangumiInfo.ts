import { throwError, isObject, isString, isArray, isNumber, isBoolean } from './helper';
import * as CDNCredentials from './CDNCredentials';

export type AudioFile = {
    title: string,
    artist: string,
    format: string,
    samplerate: string,
    bitdepth: string,
    file_name: string,
    flac_fallback: boolean
}

type ImageFile = {
    tag: string,
    file_name: string
}

interface EPInfo {
    age_restricted: string | false,
    authentication_token: string,
    dir: string,
    series_override?: string,
}

type Chapters = Array<[string, number]>;
export type VideoFormatInfo = {
    value: string,
    tag?: string
};
export interface VideoEPInfo extends EPInfo {
    type: 'video',
    title: string,
    formats: [VideoFormatInfo, ...VideoFormatInfo[]],
    chapters: Chapters,
    file_name: string,
    cdn_credentials: CDNCredentials.CDNCredentials
}

export interface AudioEPInfo extends EPInfo {
    type: 'audio',
    album_info: {
        album_title: string,
        album_artist: string
    },
    files: [AudioFile, ...AudioFile[]],
    cdn_credentials: CDNCredentials.CDNCredentials
}

export interface ImageEPInfo extends EPInfo {
    type: 'image',
    files: [ImageFile, ...ImageFile[]]
}

export type Seasons = { id: string, season_name: string }[];
export type SeriesEP = [string, ...string[]];

export type BangumiInfo = {
    title: string,
    title_override?: string,
    seasons: Seasons,
    series_ep: SeriesEP,
    ep_info: VideoEPInfo | AudioEPInfo | ImageEPInfo
}

function checkVideoEPInfo(epInfo: any) {

    if (!isString(epInfo.title)) {
        throwError();
    }

    const formats = epInfo.formats;
    if (!isArray(formats)) {
        throwError();
    }

    if (formats.length < 1) {
        throwError();
    }

    for (const format of formats) {
        if (!isObject(format)) {
            throwError();
        }

        if (!isString(format.value)) {
            throwError();
        }

        if (format.tag !== undefined && !isString(format.tag)) {
            throwError();
        }
    }

    const chapters = epInfo.chapters;
    if (!isArray(chapters)) {
        throwError();
    }

    for (const chapter of chapters) {
        if (!isArray(chapter)) {
            throwError();
        }

        if (!isString(chapter[0])) {
            throwError();
        }

        if (!isNumber(chapter[1])) {
            throwError();
        }
    }

    if (!isString(epInfo.file_name)) {
        throwError();
    }

    CDNCredentials.check(epInfo.cdn_credentials);
}

function checkAudioFile(audioFile: any) {
    if (!isObject(audioFile)) {
        throwError();
    }

    if (!isString(audioFile.title)) {
        throwError();
    }

    if (!isString(audioFile.artist)) {
        throwError();
    }

    if (!isString(audioFile.format)) {
        throwError();
    }

    if (!isString(audioFile.samplerate)) {
        throwError();
    }

    if (!isString(audioFile.bitdepth)) {
        throwError();
    }

    if (!isString(audioFile.file_name)) {
        throwError();
    }

    if (!isBoolean(audioFile.flac_fallback)) {
        throwError();
    }
}

function checkAudioEPInfo(epInfo: any) {

    const albumInfo = epInfo.album_info;
    if (!isObject(albumInfo)) {
        throwError();
    }

    if (!isString(albumInfo.album_title) || !isString(albumInfo.album_artist)) {
        throwError();
    }

    const files = epInfo.files;
    if (!isArray(files)) {
        throwError();
    }

    if (files.length < 1) {
        throwError();
    }

    for (const file of files) {
        checkAudioFile(file);
    }

    CDNCredentials.check(epInfo.cdn_credentials);
}

function checkImageFile(imageFile: any) {
    if (!isObject(imageFile)) {
        throwError();
    }

    if (!isString(imageFile.tag)) {
        throwError();
    }

    if (!isString(imageFile.file_name)) {
        throwError();
    }
}

function checkImageEPInfo(epInfo: any) {

    const files = epInfo.files;
    if (!isArray(files)) {
        throwError();
    }

    if (files.length < 1) {
        throwError();
    }

    for (const file of files) {
        checkImageFile(file);
    }
}

function checkEPInfo(epInfo: any) {
    if (!isObject(epInfo)) {
        throwError();
    }

    const ageRestricted = epInfo.age_restricted;
    if (!isString(ageRestricted) && ageRestricted !== false) {
        throwError();
    }

    const authenticationToken = epInfo.authentication_token;
    if (!isString(authenticationToken)) {
        throwError();
    }

    const dir = epInfo.dir;
    if (!isString(dir)) {
        throwError();
    }

    const seriesOverride = epInfo.series_override;
    if (seriesOverride !== undefined && !isString(seriesOverride)) {
        throwError();
    }

    const type = epInfo.type;
    if (type === 'video') {
        checkVideoEPInfo(epInfo);
    } else if (type === 'audio') {
        checkAudioEPInfo(epInfo);
    } else if (type === 'image') {
        checkImageEPInfo(epInfo);
    } else {
        throwError();
    }
}

function checkSeason(season: any) {
    if (!isObject(season)) {
        throwError();
    }

    if (!isString(season.id)) {
        throwError();
    }

    if (!isString(season.season_name)) {
        throwError();
    }
}

function checkSeriesEP(seriesEP: any) {
    if (!isString(seriesEP)) {
        throwError();
    }
}

export function check(bangumiInfo: any) {
    if (!isObject(bangumiInfo)) {
        throwError();
    }

    const title = bangumiInfo.title;
    if (!isString(title)) {
        throwError();
    }

    const titleOverride = bangumiInfo.title_override;
    if (titleOverride !== undefined && !isString(titleOverride)) {
        throwError();
    }

    const seasons = bangumiInfo.seasons;
    if (!isArray(seasons)) {
        throwError();
    }

    for (const season of seasons) {
        checkSeason(season);
    }

    const seriesEPs = bangumiInfo.series_ep;
    if (!isArray(seriesEPs)) {
        throwError();
    }

    if (seriesEPs.length < 1) {
        throwError();
    }

    for (const seriesEP of seriesEPs) {
        checkSeriesEP(seriesEP);
    }

    checkEPInfo(bangumiInfo.ep_info);
}