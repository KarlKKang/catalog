import { parseArray, parseBoolean, parseNonEmptyTypedArray, parseNumber, parseObject, parseOptional, parseString, parseTypedArray, throwError } from './helper';

export type AudioFile = {
    readonly title: string | undefined;
    readonly artist: string | undefined;
    readonly format: string | undefined;
    readonly samplerate: string | undefined;
    readonly bitdepth: string | undefined;
    readonly file_name: string;
    readonly flac_fallback: boolean | undefined;
};
type ImageFile = {
    readonly file_name: string;
};
type Chapter = [string, number];
type Chapters = ReadonlyArray<Chapter>;
export type VideoFormat = {
    readonly value: string;
    readonly tag: string | undefined;
    readonly video: string | undefined;
    readonly audio: string | undefined;
    readonly avc_fallback: boolean | undefined;
    readonly aac_fallback: boolean | undefined;
    readonly direct_download: boolean | undefined;
};
export type VideoFormats = readonly [VideoFormat, ...VideoFormat[]];

type EPInfoComm = {
    readonly age_restricted: string | undefined;
    readonly dir: string;
    readonly series_override: string | undefined;
};
type VideoEPInfoPartial = {
    readonly title: string | undefined;
    readonly formats: VideoFormats;
    readonly chapters: Chapters;
    readonly file_name: string;
};
type AudioEPInfoPartial = {
    readonly album_info: {
        readonly title: string | undefined;
        readonly artist: string | undefined;
    };
    readonly files: readonly [AudioFile, ...AudioFile[]];
};
type ImageEPInfoPartial = {
    readonly gallery_title: string | undefined;
    readonly files: readonly [ImageFile, ...ImageFile[]];
};
export type VideoEPInfo = EPInfoComm & VideoEPInfoPartial & { readonly type: 'video' };
export type AudioEPInfo = EPInfoComm & AudioEPInfoPartial & { readonly type: 'audio' };
export type ImageEPInfo = EPInfoComm & ImageEPInfoPartial & { readonly type: 'image' };

type Season = {
    readonly id: string;
    readonly name: string;
};
export type Seasons = readonly Season[];
export type SeriesEP = readonly [string, ...string[]];

export type BangumiInfo = {
    readonly title: string;
    readonly title_override: string | undefined;
    readonly seasons: Seasons;
    readonly series_ep: SeriesEP;
    readonly ep_info: VideoEPInfo | AudioEPInfo | ImageEPInfo;
};

function parseVideoFormatInfo(formats: unknown): VideoFormats {
    return parseNonEmptyTypedArray(formats, (format): VideoFormat => {
        const formatObj = parseObject(format);
        return {
            value: parseString(formatObj.value),
            tag: parseOptional(formatObj.tag, parseString),
            video: parseOptional(formatObj.video, parseString),
            audio: parseOptional(formatObj.audio, parseString),
            avc_fallback: parseOptional(formatObj.avc_fallback, parseBoolean),
            aac_fallback: parseOptional(formatObj.aac_fallback, parseBoolean),
            direct_download: parseOptional(formatObj.direct_download, parseBoolean),
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
        title: parseOptional(epInfo.title, parseString),
        formats: parseVideoFormatInfo(epInfo.formats),
        chapters: parseChapters(epInfo.chapters),
        file_name: parseString(epInfo.file_name),
    };
}

function parseAudioFile(audioFile: unknown): AudioFile {
    const audioFileObj = parseObject(audioFile);
    return {
        title: parseOptional(audioFileObj.title, parseString),
        artist: parseOptional(audioFileObj.artist, parseString),
        format: parseOptional(audioFileObj.format, parseString),
        samplerate: parseOptional(audioFileObj.samplerate, parseString),
        bitdepth: parseOptional(audioFileObj.bitdepth, parseString),
        file_name: parseString(audioFileObj.file_name),
        flac_fallback: parseOptional(audioFileObj.flac_fallback, parseBoolean),
    };
}

function parseAudioEPInfo(epInfo: ReturnType<typeof parseObject>): AudioEPInfoPartial {
    const albumInfo = parseObject(epInfo.album_info);
    return {
        album_info: {
            title: parseOptional(albumInfo.title, parseString),
            artist: parseOptional(albumInfo.artist, parseString),
        },
        files: parseNonEmptyTypedArray(epInfo.files, parseAudioFile),
    };
}

function parseImageFile(imageFile: unknown): ImageFile {
    return {
        file_name: parseString(parseObject(imageFile).file_name),
    };
}

function parseImageEPInfo(epInfo: ReturnType<typeof parseObject>): ImageEPInfoPartial {
    return {
        gallery_title: parseOptional(epInfo.gallery_title, parseString),
        files: parseNonEmptyTypedArray(epInfo.files, parseImageFile),
    };
}

function checkEPInfo(epInfo: unknown): VideoEPInfo | AudioEPInfo | ImageEPInfo {
    const epInfoObj = parseObject(epInfo);
    const type = parseString(epInfoObj.type);
    const epInfoComm: EPInfoComm = {
        age_restricted: parseOptional(epInfoObj.age_restricted, parseString),
        dir: parseString(epInfoObj.dir),
        series_override: parseOptional(epInfoObj.series_override, parseString),
    };
    if (type === 'video') {
        const videoEPInfo = parseVideoEPInfo(epInfoObj);
        return {
            ...epInfoComm,
            ...videoEPInfo,
            type: type,
        };
    } else if (type === 'audio') {
        const audioEPInfo = parseAudioEPInfo(epInfoObj);
        return {
            ...epInfoComm,
            ...audioEPInfo,
            type: type,
        };
    } else if (type === 'image') {
        const imageEPInfo = parseImageEPInfo(epInfoObj);
        return {
            ...epInfoComm,
            ...imageEPInfo,
            type: type,
        };
    }
    throwError();
}

function parseSeasons(seasons: unknown): Seasons {
    return parseNonEmptyTypedArray(seasons, (season): Season => {
        const seasonObj = parseObject(season);
        return {
            id: parseString(seasonObj.id),
            name: parseString(seasonObj.name),
        };
    });
}

export function parseBangumiInfo(bangumiInfo: unknown): BangumiInfo {
    const bangumiInfoObj = parseObject(bangumiInfo);
    return {
        title: parseString(bangumiInfoObj.title),
        title_override: parseOptional(bangumiInfoObj.title_override, parseString),
        seasons: parseSeasons(bangumiInfoObj.seasons),
        series_ep: parseNonEmptyTypedArray(bangumiInfoObj.series_ep, parseString),
        ep_info: checkEPInfo(bangumiInfoObj.ep_info),
    };
}