import { PlayerKey } from './player_key';

export const enum NonNativePlayerKey {
    BUFFERING = PlayerKey.__LENGTH, // eslint-disable-line @typescript-eslint/prefer-literal-enum-member
    GOP,
    CHECK_BUFFER_TIMEOUT,
    LAST_BUFFER_UPDATE_TIME,
    ON_BUFFER_STALLED,

    CHECK_BUFFER,
    START_BUFFER,

    __LENGTH,
}
