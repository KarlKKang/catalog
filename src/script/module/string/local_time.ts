import { getLocalTime, TimeInfoKey } from '../time/local';
import { padNumberLeft } from './pad_number_left';

export function toLocalTimeString(unixTimestamp: number, showSeconds?: boolean, showTimezone?: boolean) {
    const localTime = getLocalTime(unixTimestamp);
    let result = localTime[TimeInfoKey.YEAR] + '年' + localTime[TimeInfoKey.MONTH] + '月' + localTime[TimeInfoKey.DATE] + '日（' + localTime[TimeInfoKey.DAY_OF_WEEK] + '）' + padNumberLeft(localTime[TimeInfoKey.HOUR], 2) + '時' + padNumberLeft(localTime[TimeInfoKey.MINUTE], 2) + '分';
    if (showSeconds) {
        result += padNumberLeft(localTime[TimeInfoKey.SECOND], 2) + '秒';
    }
    if (showTimezone) {
        result += '（' + new Date().toLocaleTimeString('ja-JP', { timeZoneName: 'long' }).split(' ').at(-1) + '）';
    }
    return result;
}
