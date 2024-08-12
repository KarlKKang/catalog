import { TOP_URI } from '../../env/uri';
import { MessageParamKey } from '../type';
import { notFoundBody } from '../../text/not_found/body';
import { notFoundTitle } from '../../text/not_found/title';

export const notFound = {
    [MessageParamKey.TITLE]: notFoundTitle,
    [MessageParamKey.MESSAGE]: notFoundBody,
    [MessageParamKey.URL]: TOP_URI,
};
