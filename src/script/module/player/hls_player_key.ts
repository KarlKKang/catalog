import { NonNativePlayerKey } from './non_native_player_key';

export const enum HlsPlayerKey {
    HLS_INSTANCE = NonNativePlayerKey.__LENGTH, // eslint-disable-line @typescript-eslint/prefer-literal-enum-member
    FRAG_START,
    HLS_PRELOADED,
    HLS_MAX_MAX_BUFFER_LENGTH,

    ON_HLS_ERROR,
    ON_HLS_MANIFEST_PARSED,
    ON_HLS_FRAG_CHANGE,
    ON_HLS_BUFFER_FLUSHED,
    ON_HLS_LEVEL_LOADED,

    HLS_RESUME_PRELOAD,
}
