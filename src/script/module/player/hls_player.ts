import { NonNativePlayer } from './non-native-player';
import Hls from 'hls.js';
import type { Events, ErrorData, FragChangedData, ManifestParsedData, HlsConfig } from 'hls.js';
import { HLS_BUFFER_APPEND_ERROR, MEDIA_ERR_DECODE, MEDIA_ERR_NETWORK, MEDIA_ERR_SRC_NOT_SUPPORTED } from './media_error';

export class HlsPlayer extends NonNativePlayer {
    protected override readonly maxBufferHole = 0.5;
    private readonly hlsInstance: Hls;
    private fragStart = 0;
    private destroyed = false;

    private onHlsError: undefined | ((_: Events.ERROR, data: ErrorData) => void) = undefined;
    private onHlsManifestParsed: undefined | ((event: Events.MANIFEST_PARSED, data: ManifestParsedData) => void) = undefined;
    private onHlsFragChange: undefined | ((_: Events.FRAG_CHANGED, data: FragChangedData) => void) = undefined;
    private onHlsBufferFlushed: undefined | (() => void) = undefined;

    constructor(
        container: HTMLDivElement,
        hlsConfig: Partial<HlsConfig>,
        config?: {
            audio?: boolean;
            debug?: boolean;
        }
    ) {
        super(container, config);
        this.hlsInstance = new Hls(hlsConfig);
    }

    protected attach(this: HlsPlayer, onload: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this.preattach();

        this.onHlsError = (_: Events.ERROR, data: ErrorData) => {
            if (this.destroyed) {
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
            }
        };
        this.hlsInstance.on(Hls.Events.ERROR, this.onHlsError);

        this.onHlsManifestParsed = () => {
            if (this.destroyed) {
                return;
            }
            this.onHlsManifestParsed = undefined;
            onload();
        };
        this.hlsInstance.once(Hls.Events.MANIFEST_PARSED, this.onHlsManifestParsed);

        this.onHlsFragChange = (_: Events.FRAG_CHANGED, data: FragChangedData) => {
            if (this.destroyed) {
                return;
            }
            this.fragStart = data.frag.startDTS;
            DEVELOPMENT && this.log?.('Fragment changed: ' + this.fragStart + '-' + data.frag.endDTS);
        };
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

    protected override disattach(this: HlsPlayer) {
        this.destroyed = true;
        this.onHlsError && this.hlsInstance.off(Hls.Events.ERROR, this.onHlsError);
        this.onHlsManifestParsed && this.hlsInstance.off(Hls.Events.MANIFEST_PARSED, this.onHlsManifestParsed);
        this.onHlsFragChange && this.hlsInstance.off(Hls.Events.FRAG_CHANGED, this.onHlsFragChange);
        this.onHlsBufferFlushed && this.hlsInstance.off(Hls.Events.BUFFER_FLUSHED, this.onHlsBufferFlushed);
        this.hlsInstance.destroy();
        super.disattach();
    }

    public override seek(this: HlsPlayer, timestamp: number) {
        if (this.IS_VIDEO) {
            this.seekCheck(timestamp);
            if (timestamp >= this.fragStart) {
                this.media.currentTime = timestamp;
                DEVELOPMENT && this.log?.('Skipped buffer flushing.');
            } else {
                this.onHlsBufferFlushed = () => {
                    if (this.destroyed) {
                        return;
                    }
                    this.onHlsBufferFlushed = undefined;
                    this.media.currentTime = timestamp;
                    this.hlsInstance.startLoad(timestamp);
                    DEVELOPMENT && this.log?.('Buffer reloaded.');
                };
                this.hlsInstance.once(Hls.Events.BUFFER_FLUSHED, this.onHlsBufferFlushed);
                this.hlsInstance.trigger(Hls.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: null });
                DEVELOPMENT && this.log?.('Buffer flushed.');
            }
        } else {
            super.seek(timestamp);
        }
    }
}