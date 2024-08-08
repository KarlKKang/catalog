export type HighResTimestamp = ReturnType<typeof performance.now>;

export function getHighResTimestamp() {
    return performance.now();
}