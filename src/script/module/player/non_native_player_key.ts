import { PlayerKey } from './player_key';

export const enum NonNativePlayerKey {
    BUFFERING = PlayerKey.__LENGTH,
    LAST_BUFFER_UPDATE_TIME,
    ON_BUFFER_STALLED,

    CHECK_BUFFER,
    START_BUFFER,

    __LENGTH,
}
