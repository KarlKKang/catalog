import { floor } from '../math';

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
    let minText = secParsed.min.toString();

    if (templateSecParsed.hour > 0) {
        const hourText = secParsed.hour.toString();
        result += '0'.repeat(templateSecParsed.hour.toString().length - hourText.length) + hourText + ':';
        if (secParsed.min < 10) {
            minText = '0' + minText;
        }
    } else {
        minText = '0'.repeat(templateSecParsed.min.toString().length - minText.length) + minText;
    }

    let secText = secParsed.sec.toString();
    if (secParsed.sec < 10) {
        secText = '0' + secText;
    }

    return result + minText + ':' + secText;
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
