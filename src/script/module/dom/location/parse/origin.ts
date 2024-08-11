export function parseOrigin(url: string | URL) {
    try {
        return new URL(url).origin.toLowerCase();
    } catch {
        return null;
    }
}
