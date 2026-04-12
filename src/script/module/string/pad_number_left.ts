export function padNumberLeft(num: number, targetLength: number) {
    return num.toString().padStart(targetLength, '0');
}
