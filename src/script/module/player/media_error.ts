const enum CustomMediaError {
    MEDIA_ERR_ABORTED,
    MEDIA_ERR_NETWORK,
    MEDIA_ERR_DECODE,
    MEDIA_ERR_SRC_NOT_SUPPORTED,
    HLS_BUFFER_APPEND_ERROR,
}

export const MEDIA_ERR_ABORTED = CustomMediaError.MEDIA_ERR_ABORTED;
export const MEDIA_ERR_NETWORK = CustomMediaError.MEDIA_ERR_NETWORK;
export const MEDIA_ERR_DECODE = CustomMediaError.MEDIA_ERR_DECODE;
export const MEDIA_ERR_SRC_NOT_SUPPORTED = CustomMediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;
export const HLS_BUFFER_APPEND_ERROR = CustomMediaError.HLS_BUFFER_APPEND_ERROR;