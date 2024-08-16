import { PlayerKey } from './player_key';

export const enum NonNativePlayerKey {
    BUFFERING = PlayerKey.__LENGTH, // eslint-disable-line @typescript-eslint/prefer-literal-enum-member
    CHECK_BUFFER_TIMEOUTS,
    LAST_BUFFER_UPDATE_TIME,
    ON_BUFFER_STALLED,

    CLEAR_CHECK_BUFFER_TIMEOUTS,
    CHECK_BUFFER,
    START_BUFFER,

    __LENGTH,
}
