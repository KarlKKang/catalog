import { parseArray, parseBoolean, parseNonEmptyTypedArray, parseNumber, parseObject, parseOptional, parseString, parseTypedArray, throwError } from './helper';

export const enum AudioFileKey {
    TITLE,
    ARTIST,
    FORMAT,
    SAMPLERATE,
    BITDEPTH,
    FILE_NAME,
    FLAC_FALLBACK,
}
export type AudioFile = {
    readonly [AudioFileKey.TITLE]: string | undefined;
    readonly [AudioFileKey.ARTIST]: string | undefined;
    readonly [AudioFileKey.FORMAT]: string | undefined;
    readonly [AudioFileKey.SAMPLERATE]: string | undefined;
    readonly [AudioFileKey.BITDEPTH]: string | undefined;
    readonly [AudioFileKey.FILE_NAME]: string;
    readonly [AudioFileKey.FLAC_FALLBACK]: boolean | undefined;
};

export const enum ImageFileKey {
    FILE_NAME,
}
type ImageFile = {
    readonly [ImageFileKey.FILE_NAME]: string;
};

type Chapter = [string, number];
type Chapters = ReadonlyArray<Chapter>;

export const enum VideoFormatKey {
    VALUE,
    TAG,
    VIDEO,
    AUDIO,
    AVC_FALLBACK,
    AAC_FALLBACK,
    DIRECT_DOWNLOAD,
}
export type VideoFormat = {
    readonly [VideoFormatKey.VALUE]: string;
    readonly [VideoFormatKey.TAG]: string | undefined;
    readonly [VideoFormatKey.VIDEO]: string | undefined;
    readonly [VideoFormatKey.AUDIO]: string | undefined;
    readonly [VideoFormatKey.AVC_FALLBACK]: boolean | undefined;
    readonly [VideoFormatKey.AAC_FALLBACK]: boolean | undefined;
    readonly [VideoFormatKey.DIRECT_DOWNLOAD]: boolean | undefined;
};
export type VideoFormats = readonly [VideoFormat, ...VideoFormat[]];

export const enum EPInfoKey {
    TYPE,
    AGE_RESTRICTED,
    DIR,
    SERIES_OVERRIDE,
    TITLE,
    FORMATS,
    CHAPTERS,
    FILE_NAME,
    ALBUM_INFO,
    FILES,
}
export const enum AlbumInfoKey {
    TITLE,
    ARTIST,
}
type EPInfoComm = {
    readonly [EPInfoKey.AGE_RESTRICTED]: string | undefined;
    readonly [EPInfoKey.DIR]: string;
    readonly [EPInfoKey.SERIES_OVERRIDE]: string | undefined;
};
type VideoEPInfoPartial = {
    readonly [EPInfoKey.TITLE]: string | undefined;
    readonly [EPInfoKey.FORMATS]: VideoFormats;
    readonly [EPInfoKey.CHAPTERS]: Chapters;
    readonly [EPInfoKey.FILE_NAME]: string;
};
type AudioEPInfoPartial = {
    readonly [EPInfoKey.ALBUM_INFO]: {
        readonly [AlbumInfoKey.TITLE]: string | undefined;
        readonly [AlbumInfoKey.ARTIST]: string | undefined;
    };
    readonly [EPInfoKey.FILES]: readonly [AudioFile, ...AudioFile[]];
};
type ImageEPInfoPartial = {
    readonly [EPInfoKey.TITLE]: string | undefined;
    readonly [EPInfoKey.FILES]: readonly [ImageFile, ...ImageFile[]];
};
export type VideoEPInfo = EPInfoComm & VideoEPInfoPartial & { readonly [EPInfoKey.TYPE]: 'video' };
export type AudioEPInfo = EPInfoComm & AudioEPInfoPartial & { readonly [EPInfoKey.TYPE]: 'audio' };
export type ImageEPInfo = EPInfoComm & ImageEPInfoPartial & { readonly [EPInfoKey.TYPE]: 'image' };

export const enum SeasonKey {
    ID,
    NAME,
}
type Season = {
    readonly [SeasonKey.ID]: string;
    readonly [SeasonKey.NAME]: string;
};
export type Seasons = readonly Season[];
export type SeriesEP = readonly [string, ...string[]];

export const enum BangumiInfoKey {
    TITLE,
    TITLE_OVERRIDE,
    SEASONS,
    SERIES_EP,
    EP_INFO,
}
export type BangumiInfo = {
    readonly [BangumiInfoKey.TITLE]: string;
    readonly [BangumiInfoKey.TITLE_OVERRIDE]: string | undefined;
    readonly [BangumiInfoKey.SEASONS]: Seasons;
    readonly [BangumiInfoKey.SERIES_EP]: SeriesEP;
    readonly [BangumiInfoKey.EP_INFO]: VideoEPInfo | AudioEPInfo | ImageEPInfo;
};

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

function parseVideoEPInfo(epInfo: ReturnType<typeof parseObject>): VideoEPInfoPartial {
    return {
        [EPInfoKey.TITLE]: parseOptional(epInfo.title, parseString),
        [EPInfoKey.FORMATS]: parseVideoFormatInfo(epInfo.formats),
        [EPInfoKey.CHAPTERS]: parseChapters(epInfo.chapters),
        [EPInfoKey.FILE_NAME]: parseString(epInfo.file_name),
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

function parseAudioEPInfo(epInfo: ReturnType<typeof parseObject>): AudioEPInfoPartial {
    const albumInfo = parseObject(epInfo.album_info);
    return {
        [EPInfoKey.ALBUM_INFO]: {
            [AlbumInfoKey.TITLE]: parseOptional(albumInfo.title, parseString),
            [AlbumInfoKey.ARTIST]: parseOptional(albumInfo.artist, parseString),
        },
        [EPInfoKey.FILES]: parseNonEmptyTypedArray(epInfo.files, parseAudioFile),
    };
}

function parseImageFile(imageFile: unknown): ImageFile {
    return {
        [ImageFileKey.FILE_NAME]: parseString(parseObject(imageFile).file_name),
    };
}

function parseImageEPInfo(epInfo: ReturnType<typeof parseObject>): ImageEPInfoPartial {
    return {
        [EPInfoKey.TITLE]: parseOptional(epInfo.gallery_title, parseString),
        [EPInfoKey.FILES]: parseNonEmptyTypedArray(epInfo.files, parseImageFile),
    };
}

function checkEPInfo(epInfo: unknown): VideoEPInfo | AudioEPInfo | ImageEPInfo {
    const epInfoObj = parseObject(epInfo);
    const type = parseString(epInfoObj.type);
    const epInfoComm: EPInfoComm = {
        [EPInfoKey.AGE_RESTRICTED]: parseOptional(epInfoObj.age_restricted, parseString),
        [EPInfoKey.DIR]: parseString(epInfoObj.dir),
        [EPInfoKey.SERIES_OVERRIDE]: parseOptional(epInfoObj.series_override, parseString),
    };
    if (type === 'video') {
        const videoEPInfo = parseVideoEPInfo(epInfoObj);
        return {
            ...epInfoComm,
            ...videoEPInfo,
            [EPInfoKey.TYPE]: type,
        };
    } else if (type === 'audio') {
        const audioEPInfo = parseAudioEPInfo(epInfoObj);
        return {
            ...epInfoComm,
            ...audioEPInfo,
            [EPInfoKey.TYPE]: type,
        };
    } else if (type === 'image') {
        const imageEPInfo = parseImageEPInfo(epInfoObj);
        return {
            ...epInfoComm,
            ...imageEPInfo,
            [EPInfoKey.TYPE]: type,
        };
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

export function parseBangumiInfo(bangumiInfo: unknown): BangumiInfo {
    const bangumiInfoObj = parseObject(bangumiInfo);
    return {
        [BangumiInfoKey.TITLE]: parseString(bangumiInfoObj.title),
        [BangumiInfoKey.TITLE_OVERRIDE]: parseOptional(bangumiInfoObj.title_override, parseString),
        [BangumiInfoKey.SEASONS]: parseSeasons(bangumiInfoObj.seasons),
        [BangumiInfoKey.SERIES_EP]: parseNonEmptyTypedArray(bangumiInfoObj.series_ep, parseString),
        [BangumiInfoKey.EP_INFO]: checkEPInfo(bangumiInfoObj.ep_info),
    };
}