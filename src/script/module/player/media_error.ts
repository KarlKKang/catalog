export const enum CustomMediaError {
    MEDIA_ERR_ABORTED,
    MEDIA_ERR_NETWORK,
    MEDIA_ERR_DECODE,
    MEDIA_ERR_SRC_NOT_SUPPORTED,
    HLS_BUFFER_APPEND_ERROR,
}

export function mediaErrorCodeLookup(error: MediaError | null) {
    if (error === null) {
        return null;
    }
    switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
            return CustomMediaError.MEDIA_ERR_ABORTED;
        case MediaError.MEDIA_ERR_NETWORK:
            return CustomMediaError.MEDIA_ERR_NETWORK;
        case MediaError.MEDIA_ERR_DECODE:
            return CustomMediaError.MEDIA_ERR_DECODE;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            return CustomMediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;
        default:
            return null;
    }
}
