export function toLocationPrefix(locationCode: string) {
    if (locationCode === '') {
        return '';
    }
    return locationCode + '.';
}
