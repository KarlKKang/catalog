export function padNumberLeft(num: number, maxLength: number) {
    return num.toString().padStart(maxLength, '0');
}
