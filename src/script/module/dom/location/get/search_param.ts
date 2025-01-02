import { getHref } from './href';

export function getSearchParam(name: string): string | null {
    const urlObj = new URL(getHref());
    return urlObj.searchParams.get(name);
}
