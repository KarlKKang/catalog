import { floor } from '../math';
import { padNumberLeft } from './pad_number_left';

export function toTimestampString(sec: number, templateSec?: number) {
    if (isNaN(sec) || !isFinite(sec)) {
        return '--:--';
    }

    if (templateSec === undefined || isNaN(templateSec) || !isFinite(templateSec) || templateSec < sec) {
        templateSec = sec;
    }

    const secParsed = parseSec(sec);
    const templateSecParsed = templateSec === sec ? secParsed : parseSec(templateSec);

    let result = '';

    if (templateSecParsed.hour > 0) {
        result += padNumberLeft(secParsed.hour, getNumberLength(templateSecParsed.hour)) + ':';
        result += padNumberLeft(secParsed.min, 2);
    } else {
        result += padNumberLeft(secParsed.min, getNumberLength(templateSecParsed.min));
    }

    return result + ':' + padNumberLeft(secParsed.sec, 2);
}

function parseSec(sec: number) {
    const hour = floor(sec / 60 / 60);
    sec = sec - hour * 60 * 60;
    const min = floor(sec / 60);
    sec = sec - min * 60;
    sec = floor(sec);
    return {
        hour: hour,
        min: min,
        sec: floor(sec),
    };
}

function getNumberLength(num: number) {
    return num.toString().length;
}
