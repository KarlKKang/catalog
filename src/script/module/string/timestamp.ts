import { floor } from '../math';
import { padNumberLeft } from './pad_number_left';

export function toTimestampString(sec: number, templateSec?: number) {
    if (isNaN(sec) || !isFinite(sec)) {
        return '--:--';
    }

    if (templateSec === undefined || isNaN(templateSec) || !isFinite(templateSec) || templateSec < sec) {
        templateSec = sec;
    }

    const secParsedArr = parseSec(sec);
    const [hourParsed, minParsed, secParsed] = secParsedArr;
    const [templateHourParsed, templateMinParsed] = templateSec === sec ? secParsedArr : parseSec(templateSec);

    let result = '';

    if (templateHourParsed > 0) {
        result += padNumberLeft(hourParsed, getNumberLength(templateHourParsed)) + ':';
        result += padNumberLeft(minParsed, 2);
    } else {
        result += padNumberLeft(minParsed, getNumberLength(templateMinParsed));
    }

    return result + ':' + padNumberLeft(secParsed, 2);
}

function parseSec(sec: number) {
    const hour = floor(sec / 60 / 60);
    sec = sec - hour * 60 * 60;
    const min = floor(sec / 60);
    sec = sec - min * 60;
    sec = floor(sec);
    return [
        hour,
        min,
        sec,
    ] as const;
}

function getNumberLength(num: number) {
    return num.toString().length;
}
