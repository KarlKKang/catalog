import { MessageParamKey } from '../../../message/type';
import { CSS_COLOR } from '../../../style/color';
import { reloadButtonText } from '../../../text/button/reload';
import { getLocalTimeString } from '../../../time';
import { type MaintenanceInfo, MaintenanceInfoKey } from '../../../type/MaintenanceInfo';

export function status503(maintenanceInfo: MaintenanceInfo) {
    return {
        [MessageParamKey.TITLE]: 'メンテナンス中',
        [MessageParamKey.MESSAGE]: status503Body(maintenanceInfo),
        [MessageParamKey.COLOR]: CSS_COLOR.ORANGE,
        [MessageParamKey.BUTTON_TEXT]: reloadButtonText,
    };
};

function status503Body(maintenanceInfo: MaintenanceInfo) {
    let message = '';
    const suffix = 'ご不便をおかけして申し訳ありません。';
    const period = maintenanceInfo[MaintenanceInfoKey.PERIOD];
    if (period > 0) {
        const endTime = getLocalTimeString(maintenanceInfo[MaintenanceInfoKey.START] + period, false, false);
        message = `メンテナンス期間は${endTime}までとさせていただきます。${suffix}`;
    } else {
        message = suffix + '後ほどもう一度お試しください。';
    }
    return message;
}
