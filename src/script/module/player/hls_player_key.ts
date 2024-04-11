import { NonNativePlayerKey } from './non_native_player_key';

export const enum HlsPlayerKey {
    HLS_INSTANCE = NonNativePlayerKey.__LENGTH,
    FRAG_START,

    ON_HLS_ERROR,
    ON_HLS_MANIFEST_PARSED,
    ON_HLS_FRAG_CHANGE,
    ON_HLS_BUFFER_FLUSHED,
}