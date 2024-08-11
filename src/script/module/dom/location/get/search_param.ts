import { windowLocation } from '..';

export function getSearchParam(name: string): string | null {
    const urlObj = new URL(windowLocation.href);
    return urlObj.searchParams.get(name);
}
