import { TOP_URI } from '../../../env/uri';
import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';
import { sessionEndedTitle } from './internal/session_ended_title';

export const mediaSessionEnded = {
    [MessageParamKey.TITLE]: sessionEndedTitle,
    [MessageParamKey.MESSAGE]: 'セッションがタイムアウトした、または別のソースからのアクティビティによって新しいセッションが開始された。',
    [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
    [MessageParamKey.URL]: TOP_URI,
};
