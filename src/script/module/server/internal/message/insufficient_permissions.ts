import { TOP_URI } from '../../../env/uri';
import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';

export const insufficientPermissions = {
    [MessageParamKey.TITLE]: 'アクセスできません',
    [MessageParamKey.MESSAGE]: 'このページを閲覧する権限がありません。',
    [MessageParamKey.COLOR]: CSS_COLOR.RED,
    [MessageParamKey.URL]: TOP_URI,
};
