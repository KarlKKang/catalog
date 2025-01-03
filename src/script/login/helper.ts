import { getSearchParam } from '../module/dom/location/get/search_param';
import { TOP_URI } from '../module/env/uri';

export function getForwardURL() {
    return getSearchParam('redirect') ?? TOP_URI;
}
