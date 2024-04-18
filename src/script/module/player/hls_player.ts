import { NonNativePlayer } from './non_native_player';
import HlsLight from '../../../../hls.js/dist/hls.light.mjs';
import type { default as HlsFull, Events, ErrorData, FragChangedData, ManifestParsedData, HlsConfig, LoadPolicy, } from '../../../../hls.js';
import { CustomMediaError } from './media_error';
import { PlayerKey } from './player_key';
import { HlsPlayerKey } from './hls_player_key';

const Hls = HlsLight as unknown as typeof HlsFull;

export class HlsPlayer extends NonNativePlayer {
    protected override readonly [PlayerKey.MAX_BUFFER_HOLE] = 0.5;
    private readonly [HlsPlayerKey.HLS_INSTANCE]: HlsFull;
    private [HlsPlayerKey.FRAG_START] = 0;

    private [HlsPlayerKey.ON_HLS_ERROR]: undefined | ((_: Events.ERROR, data: ErrorData) => void) = undefined;
    private [HlsPlayerKey.ON_HLS_MANIFEST_PARSED]: undefined | ((event: Events.MANIFEST_PARSED, data: ManifestParsedData) => void) = undefined;
    private [HlsPlayerKey.ON_HLS_FRAG_CHANGE]: undefined | ((_: Events.FRAG_CHANGED, data: FragChangedData) => void) = undefined;
    private [HlsPlayerKey.ON_HLS_BUFFER_FLUSHED]: undefined | (() => void) = undefined;

    constructor(
        container: HTMLDivElement,
        hlsConfig: Partial<{
            maxBufferLength: number;
            maxMaxBufferLength: number;
            mmsMinBufferLength: number;
            minMaxBufferLength: number;
        }>,
        isVideo: boolean,
    ) {
        super(container, isVideo);
        const userHlsConfig: Partial<HlsConfig> = {
            ...hlsConfig,
            enableWorker: false,
            maxFragLookUpTolerance: 0.0,
            backBufferLength: 0,
            maxBufferSize: 0, // This size is estimated by stream bitrate, thus not accurate and not in use.
            maxBufferHole: 0.5, // In Safari 12, without this option video will stall at the start. Default: 0.1.
            xhrSetup: function (xhr: XMLHttpRequest) {
                xhr.withCredentials = true;
            },
            debug: DEVELOPMENT,
        };
        const defaultHlsConfig = Hls.DefaultConfig;
        for (const type of ['manifest', 'playlist', 'key', 'cert', 'steeringManifest'] as const) {
            const loadPolicyKey = `${type}LoadPolicy` as const;
            const loadPolicy = deepCopyLoadPolicy(defaultHlsConfig[loadPolicyKey]);
            loadPolicy.default.maxTimeToFirstByteMs = Infinity;
            userHlsConfig[loadPolicyKey] = loadPolicy;
        }
        const fragLoadPolicy = deepCopyLoadPolicy(defaultHlsConfig.fragLoadPolicy);
        fragLoadPolicy.default.maxTimeToFirstByteMs = 30000;
        userHlsConfig.fragLoadPolicy = fragLoadPolicy;
        this[HlsPlayerKey.HLS_INSTANCE] = new Hls(userHlsConfig);
        DEVELOPMENT && console.log(this[HlsPlayerKey.HLS_INSTANCE].config);
    }

    protected [PlayerKey.ATTACH](this: HlsPlayer, onload: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this[PlayerKey.PRE_ATTACH]();

        const onHlsError = (_: Events.ERROR, data: ErrorData) => {
            if (this[HlsPlayerKey.ON_HLS_ERROR] !== onHlsError) {
                return;
            }
            if (data.fatal) {
                const errorType = data.type;
                let errorCode = null;
                if (errorType === Hls.ErrorTypes.NETWORK_ERROR) {
                    errorCode = CustomMediaError.MEDIA_ERR_NETWORK;
                } else if (errorType === Hls.ErrorTypes.MUX_ERROR) {
                    errorCode = CustomMediaError.MEDIA_ERR_DECODE;
                } else if (errorType === Hls.ErrorTypes.MEDIA_ERROR) {
                    if ([
                        Hls.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR,
                        Hls.ErrorDetails.BUFFER_ADD_CODEC_ERROR,
                        Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR,
                    ].includes(data.details)) {
                        errorCode = CustomMediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;
                    } else if (data.details === Hls.ErrorDetails.BUFFER_APPEND_ERROR) {
                        errorCode = CustomMediaError.HLS_BUFFER_APPEND_ERROR;
                    } else {
                        errorCode = CustomMediaError.MEDIA_ERR_DECODE;
                    }
                }
                onerror && onerror(errorCode);
                console.error(data);
            } else {
                DEVELOPMENT && console.warn(data);
            }
        };
        this[HlsPlayerKey.ON_HLS_ERROR] = onHlsError;
        this[HlsPlayerKey.HLS_INSTANCE].on(Hls.Events.ERROR, this[HlsPlayerKey.ON_HLS_ERROR]);

        const onHlsManifestParsed = () => {
            if (this[HlsPlayerKey.ON_HLS_MANIFEST_PARSED] !== onHlsManifestParsed) {
                return;
            }
            this[HlsPlayerKey.ON_HLS_MANIFEST_PARSED] = undefined;
            onload();
        };
        this[HlsPlayerKey.ON_HLS_MANIFEST_PARSED] = onHlsManifestParsed;
        this[HlsPlayerKey.HLS_INSTANCE].once(Hls.Events.MANIFEST_PARSED, this[HlsPlayerKey.ON_HLS_MANIFEST_PARSED]);

        const onHlsFragChange = (_: Events.FRAG_CHANGED, data: FragChangedData) => {
            if (this[HlsPlayerKey.ON_HLS_FRAG_CHANGE] !== onHlsFragChange) {
                return;
            }
            this[HlsPlayerKey.FRAG_START] = data.frag.startDTS;
            DEVELOPMENT && this[PlayerKey.LOG]?.('Fragment changed: ' + this[HlsPlayerKey.FRAG_START] + '-' + data.frag.endDTS);
        };
        this[HlsPlayerKey.ON_HLS_FRAG_CHANGE] = onHlsFragChange;
        this[HlsPlayerKey.HLS_INSTANCE].on(Hls.Events.FRAG_CHANGED, this[HlsPlayerKey.ON_HLS_FRAG_CHANGE]);

        this[HlsPlayerKey.HLS_INSTANCE].attachMedia(this[PlayerKey.MEDIA]);
        this[PlayerKey.MEDIA].volume = 1;
        DEVELOPMENT && this[PlayerKey.LOG]?.('HLS is attached.');
    }

    public [PlayerKey.LOAD](
        this: HlsPlayer,
        url: string,
        config?: {
            play?: boolean | undefined;
            startTime?: number | undefined;
            onload?: (...args: any[]) => void;
            onerror?: (errorCode: number | null) => void;
        }
    ): void {
        config = config ?? {};
        const play = config.play === true;
        const startTime = config.startTime;

        if (!this[PlayerKey.ATTACHED]) {
            const onload = config.onload;
            this[PlayerKey.ATTACH]((event: Events.MANIFEST_PARSED, data: ManifestParsedData) => {
                if (startTime !== undefined) {
                    this[PlayerKey.SEEK](startTime);
                }
                if (play) {
                    this[PlayerKey.PLAY]();
                }
                onload && onload(event, data);
            }, config.onerror);
        }

        this[HlsPlayerKey.HLS_INSTANCE].loadSource(url);
        DEVELOPMENT && this[PlayerKey.LOG]?.('HLS source loaded: ' + url);
    }

    protected override[PlayerKey.DETACH](this: HlsPlayer) {
        this[HlsPlayerKey.ON_HLS_ERROR] && this[HlsPlayerKey.HLS_INSTANCE].off(Hls.Events.ERROR, this[HlsPlayerKey.ON_HLS_ERROR]);
        this[HlsPlayerKey.ON_HLS_ERROR] = undefined;
        this[HlsPlayerKey.ON_HLS_MANIFEST_PARSED] && this[HlsPlayerKey.HLS_INSTANCE].off(Hls.Events.MANIFEST_PARSED, this[HlsPlayerKey.ON_HLS_MANIFEST_PARSED]);
        this[HlsPlayerKey.ON_HLS_MANIFEST_PARSED] = undefined;
        this[HlsPlayerKey.ON_HLS_FRAG_CHANGE] && this[HlsPlayerKey.HLS_INSTANCE].off(Hls.Events.FRAG_CHANGED, this[HlsPlayerKey.ON_HLS_FRAG_CHANGE]);
        this[HlsPlayerKey.ON_HLS_FRAG_CHANGE] = undefined;
        this[HlsPlayerKey.ON_HLS_BUFFER_FLUSHED] && this[HlsPlayerKey.HLS_INSTANCE].off(Hls.Events.BUFFER_FLUSHED, this[HlsPlayerKey.ON_HLS_BUFFER_FLUSHED]);
        this[HlsPlayerKey.ON_HLS_BUFFER_FLUSHED] = undefined;
        this[HlsPlayerKey.HLS_INSTANCE].destroy();
        super[PlayerKey.DETACH]();
    }

    public override[PlayerKey.SEEK](this: HlsPlayer, timestamp: number, callback?: () => void) {
        if (this[PlayerKey.IS_VIDEO]) {
            this[PlayerKey.END_CHECK](timestamp);
            if (timestamp >= this[HlsPlayerKey.FRAG_START]) {
                this[PlayerKey.MEDIA].currentTime = timestamp;
                callback?.();
                DEVELOPMENT && this[PlayerKey.LOG]?.('Skipped buffer flushing.');
            } else {
                const onHlsBufferFlushed = () => {
                    if (this[HlsPlayerKey.ON_HLS_BUFFER_FLUSHED] !== onHlsBufferFlushed) {
                        return;
                    }
                    this[HlsPlayerKey.ON_HLS_BUFFER_FLUSHED] = undefined;
                    this[PlayerKey.END_CHECK](timestamp); // Check again in case other events caused the player to end.
                    this[PlayerKey.MEDIA].currentTime = timestamp;
                    this[HlsPlayerKey.HLS_INSTANCE].startLoad(timestamp);
                    callback?.();
                    DEVELOPMENT && this[PlayerKey.LOG]?.('Buffer reloaded.');
                };
                this[HlsPlayerKey.ON_HLS_BUFFER_FLUSHED] = onHlsBufferFlushed;
                this[HlsPlayerKey.HLS_INSTANCE].once(Hls.Events.BUFFER_FLUSHED, this[HlsPlayerKey.ON_HLS_BUFFER_FLUSHED]);
                this[HlsPlayerKey.HLS_INSTANCE].trigger(Hls.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: null });
                DEVELOPMENT && this[PlayerKey.LOG]?.('Buffer flushed.');
            }
        } else {
            super[PlayerKey.SEEK](timestamp, callback);
        }
    }
}

function deepCopyLoadPolicy(obj: LoadPolicy): LoadPolicy {
    return JSON.parse(JSON.stringify(obj));
}