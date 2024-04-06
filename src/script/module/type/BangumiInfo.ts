import { parseArray, parseBoolean, parseNumber, parseObject, parseOptional, parseString, throwError } from './helper';

export type AudioFile = {
    readonly title: string;
    readonly artist: string;
    readonly format: string;
    readonly samplerate: string;
    readonly bitdepth: string;
    readonly file_name: string;
    readonly flac_fallback: boolean;
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
    readonly age_restricted: string | false;
    readonly dir: string;
    readonly series_override: string | undefined;
};
type VideoEPInfoPartial = {
    readonly title: string;
    readonly formats: VideoFormats;
    readonly chapters: Chapters;
    readonly file_name: string;
};
type AudioEPInfoPartial = {
    readonly album_info: {
        readonly album_title: string;
        readonly album_artist: string;
    };
    readonly files: readonly [AudioFile, ...AudioFile[]];
};
type ImageEPInfoPartial = {
    readonly gallery_title: string;
    readonly files: readonly [ImageFile, ...ImageFile[]];
};
export type VideoEPInfo = EPInfoComm & VideoEPInfoPartial & { readonly type: 'video' };
export type AudioEPInfo = EPInfoComm & AudioEPInfoPartial & { readonly type: 'audio' };
export type ImageEPInfo = EPInfoComm & ImageEPInfoPartial & { readonly type: 'image' };

type Season = {
    readonly id: string;
    readonly season_name: string;
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
    const formatsArr = parseArray(formats);
    const formatsParsed: VideoFormat[] = [];
    for (const format of formatsArr) {
        const formatObj = parseObject(format);
        formatsParsed.push({
            value: parseString(formatObj.value),
            tag: parseOptional(formatObj.tag, parseString),
            video: parseOptional(formatObj.video, parseString),
            audio: parseOptional(formatObj.audio, parseString),
            avc_fallback: parseOptional(formatObj.avc_fallback, parseBoolean),
            aac_fallback: parseOptional(formatObj.aac_fallback, parseBoolean),
            direct_download: parseOptional(formatObj.direct_download, parseBoolean),
        });
    }
    const formatFirst = formatsParsed[0];
    if (formatFirst === undefined) {
        throwError();
    }
    return [formatFirst, ...formatsParsed.slice(1)];
}

function parseChapters(chapters: unknown): Chapters {
    const chaptersArr = parseArray(chapters);
    const chaptersParsed: Chapter[] = [];
    for (const chapter of chaptersArr) {
        const chapterArr = parseArray(chapter);
        chaptersParsed.push([parseString(chapterArr[0]), parseNumber(chapterArr[1])]);
    }
    return chaptersParsed;
}

function parseVideoEPInfo(epInfo: ReturnType<typeof parseObject>): VideoEPInfoPartial {
    return {
        title: parseString(epInfo.title),
        formats: parseVideoFormatInfo(epInfo.formats),
        chapters: parseChapters(epInfo.chapters),
        file_name: parseString(epInfo.file_name),
    };
}

function parseAudioFile(audioFile: unknown): AudioFile {
    const audioFileObj = parseObject(audioFile);
    return {
        title: parseString(audioFileObj.title),
        artist: parseString(audioFileObj.artist),
        format: parseString(audioFileObj.format),
        samplerate: parseString(audioFileObj.samplerate),
        bitdepth: parseString(audioFileObj.bitdepth),
        file_name: parseString(audioFileObj.file_name),
        flac_fallback: parseBoolean(audioFileObj.flac_fallback),
    };
}

function parseAudioEPInfo(epInfo: ReturnType<typeof parseObject>): AudioEPInfoPartial {
    const albumInfo = parseObject(epInfo.album_info);

    const files = parseArray(epInfo.files);
    const filesParsed: AudioFile[] = [];
    for (const file of files) {
        filesParsed.push(parseAudioFile(file));
    }
    const fileFirst = filesParsed[0];
    if (fileFirst === undefined) {
        throwError();
    }

    return {
        album_info: {
            album_title: parseString(albumInfo.album_title),
            album_artist: parseString(albumInfo.album_artist),
        },
        files: [fileFirst, ...filesParsed.slice(1)],
    };
}

function parseImageFile(imageFile: unknown): ImageFile {
    return {
        file_name: parseString(parseObject(imageFile).file_name),
    };
}

function parseImageEPInfo(epInfo: ReturnType<typeof parseObject>): ImageEPInfoPartial {
    const files = parseArray(epInfo.files);
    const filesParsed: ImageFile[] = [];
    for (const file of files) {
        filesParsed.push(parseImageFile(file));
    }
    const fileFirst = filesParsed[0];
    if (fileFirst === undefined) {
        throwError();
    }

    return {
        gallery_title: parseString(epInfo.gallery_title),
        files: [fileFirst, ...filesParsed.slice(1)],
    };
}

function checkEPInfo(epInfo: unknown): VideoEPInfo | AudioEPInfo | ImageEPInfo {
    const epInfoObj = parseObject(epInfo);
    const ageRestricted = epInfoObj.age_restricted;

    const type = parseString(epInfoObj.type);
    const epInfoComm: EPInfoComm = {
        age_restricted: ageRestricted === false ? false : parseString(ageRestricted),
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
    const seasonsArr = parseArray(seasons);
    const seasonsParsed: Season[] = [];
    for (const season of seasonsArr) {
        const seasonObj = parseObject(season);
        seasonsParsed.push({
            id: parseString(seasonObj.id),
            season_name: parseString(seasonObj.season_name),
        });
    }
    return seasonsParsed;
}

function parseSeriesEP(seriesEP: unknown): SeriesEP {
    const seriesEPArr = parseArray(seriesEP);
    const seriesEPParsed: string[] = [];
    for (const seriesEP of seriesEPArr) {
        seriesEPParsed.push(parseString(seriesEP));
    }
    const seriesEPFirst = seriesEPParsed[0];
    if (seriesEPFirst === undefined) {
        throwError();
    }
    return [seriesEPFirst, ...seriesEPParsed.slice(1)];
}

export function parseBangumiInfo(bangumiInfo: unknown): BangumiInfo {
    const bangumiInfoObj = parseObject(bangumiInfo);
    return {
        title: parseString(bangumiInfoObj.title),
        title_override: parseOptional(bangumiInfoObj.title_override, parseString),
        seasons: parseSeasons(bangumiInfoObj.seasons),
        series_ep: parseSeriesEP(bangumiInfoObj.series_ep),
        ep_info: checkEPInfo(bangumiInfoObj.ep_info),
    };
}