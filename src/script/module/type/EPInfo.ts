import { throwError } from './internal/throw_error';
import { parseObject } from './internal/parse_object';
import { parseNumber } from './internal/parse_number';
import { parseArray } from './internal/parse_array';
import { parseTypedArray } from './internal/parse_array/typed';
import { parseNonEmptyTypedArray } from './internal/parse_array/typed/non_empty';
import { parseBoolean } from './internal/parse_boolean';
import { parseString } from './internal/parse_string';
import { parseOptional } from './internal/parse_optional';

export const enum AudioFileKey {
    TITLE,
    ARTIST,
    FORMAT,
    SAMPLERATE,
    BITDEPTH,
    FILE_NAME,
    FLAC_FALLBACK,
}
export interface AudioFile {
    readonly [AudioFileKey.TITLE]: string | undefined;
    readonly [AudioFileKey.ARTIST]: string | undefined;
    readonly [AudioFileKey.FORMAT]: string | undefined;
    readonly [AudioFileKey.SAMPLERATE]: string | undefined;
    readonly [AudioFileKey.BITDEPTH]: string | undefined;
    readonly [AudioFileKey.FILE_NAME]: string;
    readonly [AudioFileKey.FLAC_FALLBACK]: boolean | undefined;
}

export const enum ImageFileKey {
    FILE_NAME,
}
interface ImageFile {
    readonly [ImageFileKey.FILE_NAME]: string;
}

type Chapter = [string, number];
type Chapters = readonly Chapter[];

export const enum VideoFormatKey {
    VALUE,
    TAG,
    VIDEO,
    AUDIO,
    AVC_FALLBACK,
    AAC_FALLBACK,
    DIRECT_DOWNLOAD,
}
export interface VideoFormat {
    readonly [VideoFormatKey.VALUE]: string;
    readonly [VideoFormatKey.TAG]: string | undefined;
    readonly [VideoFormatKey.VIDEO]: string | undefined;
    readonly [VideoFormatKey.AUDIO]: string | undefined;
    readonly [VideoFormatKey.AVC_FALLBACK]: boolean | undefined;
    readonly [VideoFormatKey.AAC_FALLBACK]: boolean | undefined;
    readonly [VideoFormatKey.DIRECT_DOWNLOAD]: boolean | undefined;
}
export type VideoFormats = readonly [VideoFormat, ...VideoFormat[]];

export const enum FileInfoKey {
    TYPE,
    TITLE,
    FORMATS,
    CHAPTERS,
    FILE_NAME,
    ALBUM_INFO,
    FILES,
    RC_VER,
}
export const enum AlbumInfoKey {
    TITLE,
    ARTIST,
}
export interface VideoFileInfo {
    readonly [FileInfoKey.TYPE]: 'video';
    readonly [FileInfoKey.TITLE]: string | undefined;
    readonly [FileInfoKey.FORMATS]: VideoFormats;
    readonly [FileInfoKey.CHAPTERS]: Chapters;
    readonly [FileInfoKey.FILE_NAME]: string;
    readonly [FileInfoKey.RC_VER]: string | undefined;
}
export interface AudioFileInfo {
    readonly [FileInfoKey.TYPE]: 'audio';
    readonly [FileInfoKey.ALBUM_INFO]: {
        readonly [AlbumInfoKey.TITLE]: string | undefined;
        readonly [AlbumInfoKey.ARTIST]: string | undefined;
    };
    readonly [FileInfoKey.FILES]: readonly [AudioFile, ...AudioFile[]];
}
export interface ImageFileInfo {
    readonly [FileInfoKey.TYPE]: 'image';
    readonly [FileInfoKey.TITLE]: string | undefined;
    readonly [FileInfoKey.FILES]: readonly [ImageFile, ...ImageFile[]];
}

export const enum SeasonKey {
    ID,
    NAME,
}
interface Season {
    readonly [SeasonKey.ID]: string;
    readonly [SeasonKey.NAME]: string;
}
export type Seasons = readonly Season[];
export type SeriesEP = readonly [string, ...string[]];

export const enum EPInfoKey {
    TITLE,
    TITLE_OVERRIDE,
    SEASONS,
    SERIES_EP,
    FILE_INFO,
    AGE_RESTRICTED,
    DIR,
    SERIES_OVERRIDE,
}
export interface EPInfo {
    readonly [EPInfoKey.TITLE]: string;
    readonly [EPInfoKey.TITLE_OVERRIDE]: string | undefined;
    readonly [EPInfoKey.SEASONS]: Seasons;
    readonly [EPInfoKey.SERIES_EP]: SeriesEP;
    readonly [EPInfoKey.AGE_RESTRICTED]: string | undefined;
    readonly [EPInfoKey.DIR]: string;
    readonly [EPInfoKey.SERIES_OVERRIDE]: string | undefined;
    readonly [EPInfoKey.FILE_INFO]: VideoFileInfo | AudioFileInfo | ImageFileInfo;
}

function parseVideoFormatInfo(formats: unknown): VideoFormats {
    return parseNonEmptyTypedArray(formats, (format): VideoFormat => {
        const formatObj = parseObject(format);
        return {
            [VideoFormatKey.VALUE]: parseString(formatObj.value),
            [VideoFormatKey.TAG]: parseOptional(formatObj.tag, parseString),
            [VideoFormatKey.VIDEO]: parseOptional(formatObj.video, parseString),
            [VideoFormatKey.AUDIO]: parseOptional(formatObj.audio, parseString),
            [VideoFormatKey.AVC_FALLBACK]: parseOptional(formatObj.avc_fallback, parseBoolean),
            [VideoFormatKey.AAC_FALLBACK]: parseOptional(formatObj.aac_fallback, parseBoolean),
            [VideoFormatKey.DIRECT_DOWNLOAD]: parseOptional(formatObj.direct_download, parseBoolean),
        };
    });
}

function parseChapters(chapters: unknown): Chapters {
    return parseTypedArray(chapters, (chapter): Chapter => {
        const chapterArr = parseArray(chapter);
        return [parseString(chapterArr[0]), parseNumber(chapterArr[1])];
    });
}

function parseVideoFileInfo(fileInfo: ReturnType<typeof parseObject>): VideoFileInfo {
    return {
        [FileInfoKey.TYPE]: 'video',
        [FileInfoKey.TITLE]: parseOptional(fileInfo.title, parseString),
        [FileInfoKey.FORMATS]: parseVideoFormatInfo(fileInfo.formats),
        [FileInfoKey.CHAPTERS]: parseChapters(fileInfo.chapters),
        [FileInfoKey.FILE_NAME]: parseString(fileInfo.file_name),
        [FileInfoKey.RC_VER]: parseOptional(fileInfo.rc_ver, parseString),
    };
}

function parseAudioFile(audioFile: unknown): AudioFile {
    const audioFileObj = parseObject(audioFile);
    return {
        [AudioFileKey.TITLE]: parseOptional(audioFileObj.title, parseString),
        [AudioFileKey.ARTIST]: parseOptional(audioFileObj.artist, parseString),
        [AudioFileKey.FORMAT]: parseOptional(audioFileObj.format, parseString),
        [AudioFileKey.SAMPLERATE]: parseOptional(audioFileObj.samplerate, parseString),
        [AudioFileKey.BITDEPTH]: parseOptional(audioFileObj.bitdepth, parseString),
        [AudioFileKey.FILE_NAME]: parseString(audioFileObj.file_name),
        [AudioFileKey.FLAC_FALLBACK]: parseOptional(audioFileObj.flac_fallback, parseBoolean),
    };
}

function parseAudioFileInfo(fileInfo: ReturnType<typeof parseObject>): AudioFileInfo {
    const albumInfo = parseObject(fileInfo.album_info);
    return {
        [FileInfoKey.TYPE]: 'audio',
        [FileInfoKey.ALBUM_INFO]: {
            [AlbumInfoKey.TITLE]: parseOptional(albumInfo.title, parseString),
            [AlbumInfoKey.ARTIST]: parseOptional(albumInfo.artist, parseString),
        },
        [FileInfoKey.FILES]: parseNonEmptyTypedArray(fileInfo.files, parseAudioFile),
    };
}

function parseImageFile(imageFile: unknown): ImageFile {
    return {
        [ImageFileKey.FILE_NAME]: parseString(parseObject(imageFile).file_name),
    };
}

function parseImageFileInfo(fileInfo: ReturnType<typeof parseObject>): ImageFileInfo {
    return {
        [FileInfoKey.TYPE]: 'image',
        [FileInfoKey.TITLE]: parseOptional(fileInfo.gallery_title, parseString),
        [FileInfoKey.FILES]: parseNonEmptyTypedArray(fileInfo.files, parseImageFile),
    };
}

function parseFileInfo(fileInfo: unknown): VideoFileInfo | AudioFileInfo | ImageFileInfo {
    const fileInfoObj = parseObject(fileInfo);
    const type = parseString(fileInfoObj.type);
    if (type === 'video') {
        return parseVideoFileInfo(fileInfoObj);
    } else if (type === 'audio') {
        return parseAudioFileInfo(fileInfoObj);
    } else if (type === 'image') {
        return parseImageFileInfo(fileInfoObj);
    }
    throwError();
}

function parseSeasons(seasons: unknown): Seasons {
    return parseTypedArray(seasons, (season): Season => {
        const seasonObj = parseObject(season);
        return {
            [SeasonKey.ID]: parseString(seasonObj.id),
            [SeasonKey.NAME]: parseString(seasonObj.name),
        };
    });
}

export function parseEPInfo(epInfo: unknown): EPInfo {
    const epInfoObj = parseObject(epInfo);
    return {
        [EPInfoKey.TITLE]: parseString(epInfoObj.title),
        [EPInfoKey.TITLE_OVERRIDE]: parseOptional(epInfoObj.title_override, parseString),
        [EPInfoKey.SEASONS]: parseSeasons(epInfoObj.seasons),
        [EPInfoKey.SERIES_EP]: parseNonEmptyTypedArray(epInfoObj.series_ep, parseString),
        [EPInfoKey.AGE_RESTRICTED]: parseOptional(epInfoObj.age_restricted, parseString),
        [EPInfoKey.DIR]: parseString(epInfoObj.dir),
        [EPInfoKey.SERIES_OVERRIDE]: parseOptional(epInfoObj.series_override, parseString),
        [EPInfoKey.FILE_INFO]: parseFileInfo(epInfoObj.file_info),
    };
}
