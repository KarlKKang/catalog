export const enum TimeInfoKey {
    YEAR,
    MONTH,
    DATE,
    DAY_OF_WEEK,
    HOUR,
    MINUTE,
    SECOND,
}

export function getLocalTime(unixTimestamp?: number) {
    let date: Date;
    if (unixTimestamp === undefined) {
        date = new Date();
    } else {
        date = new Date(unixTimestamp * 1000);
    }
    return {
        [TimeInfoKey.YEAR]: date.getFullYear(),
        [TimeInfoKey.MONTH]: date.getMonth() + 1,
        [TimeInfoKey.DATE]: date.getDate(),
        [TimeInfoKey.DAY_OF_WEEK]: getDayOfWeek(date),
        [TimeInfoKey.HOUR]: date.getHours(),
        [TimeInfoKey.MINUTE]: date.getMinutes(),
        [TimeInfoKey.SECOND]: date.getSeconds(),
    };
}
function getDayOfWeek(date: Date): string {
    const index = date.getDay();
    let result: string;
    switch (index) {
        case 1:
            result = '月';
            break;
        case 2:
            result = '火';
            break;
        case 3:
            result = '水';
            break;
        case 4:
            result = '木';
            break;
        case 5:
            result = '金';
            break;
        case 6:
            result = '土';
            break;
        default:
            result = '日';
    }
    return result;
}
