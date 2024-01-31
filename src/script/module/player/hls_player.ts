import { NonNativePlayer } from './non-native-player';
import Hls from 'hls.js';
import type { Events, ErrorData, FragChangedData, ManifestParsedData, HlsConfig, LoadPolicy, } from 'hls.js';
import { HLS_BUFFER_APPEND_ERROR, MEDIA_ERR_DECODE, MEDIA_ERR_NETWORK, MEDIA_ERR_SRC_NOT_SUPPORTED } from './media_error';

export class HlsPlayer extends NonNativePlayer {
    protected override readonly maxBufferHole = 0.5;
    private readonly hlsInstance: Hls;
    private fragStart = 0;

    private onHlsError: undefined | ((_: Events.ERROR, data: ErrorData) => void) = undefined;
    private onHlsManifestParsed: undefined | ((event: Events.MANIFEST_PARSED, data: ManifestParsedData) => void) = undefined;
    private onHlsFragChange: undefined | ((_: Events.FRAG_CHANGED, data: FragChangedData) => void) = undefined;
    private onHlsBufferFlushed: undefined | (() => void) = undefined;

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
        this.hlsInstance = new Hls(userHlsConfig);
        DEVELOPMENT && console.log(this.hlsInstance.config);
    }

    protected attach(this: HlsPlayer, onload: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this.preattach();

        const onHlsError = (_: Events.ERROR, data: ErrorData) => {
            if (this.onHlsError !== onHlsError) {
                return;
            }
            if (data.fatal) {
                const errorType = data.type;
                let errorCode = null;
                if (errorType === Hls.ErrorTypes.NETWORK_ERROR) {
                    errorCode = MEDIA_ERR_NETWORK;
                } else if (errorType === Hls.ErrorTypes.MUX_ERROR) {
                    errorCode = MEDIA_ERR_DECODE;
                } else if (errorType === Hls.ErrorTypes.MEDIA_ERROR) {
                    if ([
                        Hls.ErrorDetails.MANIFEST_INCOMPATIBLE_CODECS_ERROR,
                        Hls.ErrorDetails.BUFFER_ADD_CODEC_ERROR,
                        Hls.ErrorDetails.BUFFER_INCOMPATIBLE_CODECS_ERROR,
                    ].includes(data.details)) {
                        errorCode = MEDIA_ERR_SRC_NOT_SUPPORTED;
                    } else if (data.details === Hls.ErrorDetails.BUFFER_APPEND_ERROR) {
                        errorCode = HLS_BUFFER_APPEND_ERROR;
                    } else {
                        errorCode = MEDIA_ERR_DECODE;
                    }
                }
                onerror && onerror(errorCode);
                console.error(data);
            } else {
                DEVELOPMENT && console.warn(data);
            }
        };
        this.onHlsError = onHlsError;
        this.hlsInstance.on(Hls.Events.ERROR, this.onHlsError);

        const onHlsManifestParsed = () => {
            if (this.onHlsManifestParsed !== onHlsManifestParsed) {
                return;
            }
            this.onHlsManifestParsed = undefined;
            onload();
        };
        this.onHlsManifestParsed = onHlsManifestParsed;
        this.hlsInstance.once(Hls.Events.MANIFEST_PARSED, this.onHlsManifestParsed);

        const onHlsFragChange = (_: Events.FRAG_CHANGED, data: FragChangedData) => {
            if (this.onHlsFragChange !== onHlsFragChange) {
                return;
            }
            this.fragStart = data.frag.startDTS;
            DEVELOPMENT && this.log?.('Fragment changed: ' + this.fragStart + '-' + data.frag.endDTS);
        };
        this.onHlsFragChange = onHlsFragChange;
        this.hlsInstance.on(Hls.Events.FRAG_CHANGED, this.onHlsFragChange);

        this.hlsInstance.attachMedia(this.media);
        this.media.volume = 1;
        DEVELOPMENT && this.log?.('HLS is attached.');
    }

    public load(
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

        if (!this.attached) {
            const onload = config.onload;
            this.attach((event: Events.MANIFEST_PARSED, data: ManifestParsedData) => {
                if (startTime !== undefined) {
                    this.seek(startTime);
                }
                if (play) {
                    this.play();
                }
                onload && onload(event, data);
            }, config.onerror);
        }

        this.hlsInstance.loadSource(url);
        DEVELOPMENT && this.log?.('HLS source loaded.');
    }

    protected override detach(this: HlsPlayer) {
        this.onHlsError && this.hlsInstance.off(Hls.Events.ERROR, this.onHlsError);
        this.onHlsError = undefined;
        this.onHlsManifestParsed && this.hlsInstance.off(Hls.Events.MANIFEST_PARSED, this.onHlsManifestParsed);
        this.onHlsManifestParsed = undefined;
        this.onHlsFragChange && this.hlsInstance.off(Hls.Events.FRAG_CHANGED, this.onHlsFragChange);
        this.onHlsFragChange = undefined;
        this.onHlsBufferFlushed && this.hlsInstance.off(Hls.Events.BUFFER_FLUSHED, this.onHlsBufferFlushed);
        this.onHlsBufferFlushed = undefined;
        this.hlsInstance.destroy();
        super.detach();
    }

    public override seek(this: HlsPlayer, timestamp: number) {
        if (this.IS_VIDEO) {
            this.seekCheck(timestamp);
            if (timestamp >= this.fragStart) {
                this.media.currentTime = timestamp;
                DEVELOPMENT && this.log?.('Skipped buffer flushing.');
            } else {
                const onHlsBufferFlushed = () => {
                    if (this.onHlsBufferFlushed !== onHlsBufferFlushed) {
                        return;
                    }
                    this.onHlsBufferFlushed = undefined;
                    this.media.currentTime = timestamp;
                    this.hlsInstance.startLoad(timestamp);
                    DEVELOPMENT && this.log?.('Buffer reloaded.');
                };
                this.onHlsBufferFlushed = onHlsBufferFlushed;
                this.hlsInstance.once(Hls.Events.BUFFER_FLUSHED, this.onHlsBufferFlushed);
                this.hlsInstance.trigger(Hls.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: null });
                DEVELOPMENT && this.log?.('Buffer flushed.');
            }
        } else {
            super.seek(timestamp);
        }
    }
}

function deepCopyLoadPolicy(obj: LoadPolicy): LoadPolicy {
    return JSON.parse(JSON.stringify(obj));
}