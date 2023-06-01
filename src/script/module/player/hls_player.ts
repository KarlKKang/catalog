import { NonNativePlayer } from './non-native-player';
import { remove } from '../dom';
import Hls from 'hls.js';
import type { Events, ErrorData, FragChangedData, ManifestParsedData, HlsConfig } from 'hls.js';
import { CustomMediaError } from './media_error';

export class HlsPlayer extends NonNativePlayer {
    protected override readonly maxBufferHole = 0.5;
    private readonly hlsInstance: Hls;
    private fragStart = 0;

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

    protected attach(this: HlsPlayer, onload?: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this.preattach();

        this.hlsInstance.on(Hls.Events.ERROR, function (this: any, _: Events.ERROR, data: ErrorData) {
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
            }
        });
        this.hlsInstance.on(Hls.Events.MANIFEST_PARSED, function (this: any, event: Events.MANIFEST_PARSED, data: ManifestParsedData) {
            onload && onload.call(this, event, data);
        });
        this.hlsInstance.on(Hls.Events.FRAG_CHANGED, function (this: HlsPlayer, _: Events.FRAG_CHANGED, data: FragChangedData) {
            this.fragStart = data.frag.startDTS;
            this.onScreenConsoleOutput('Fragment changed: ' + this.fragStart + '-' + data.frag.endDTS);
        }.bind(this));
        this.hlsInstance.attachMedia(this.media);
        this.media.volume = 1;
        this.onScreenConsoleOutput('HLS is attached.');
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

        if (!this.attached) {
            this.attach(config.onload, config.onerror);
        }

        const play = config.play === true;
        const startTime = config.startTime;

        const callback = function (this: HlsPlayer) {
            if (startTime !== undefined) {
                this.seek(startTime);
            }
            if (play) {
                this.play();
            }
        }.bind(this);

        this.hlsInstance.once(Hls.Events.MANIFEST_PARSED, callback);
        this.hlsInstance.loadSource(url);
        this.onScreenConsoleOutput('HLS source loaded.');
    }

    public destroy(this: HlsPlayer) {
        this.timer && clearInterval(this.timer);
        this.hlsInstance.destroy();
        remove(this.controls);
    }

    public override seek(this: HlsPlayer, timestamp: number) {
        if (this.IS_VIDEO) {
            this.seekCheck(timestamp);
            if (timestamp >= this.fragStart) {
                this.media.currentTime = timestamp;
                this.onScreenConsoleOutput('Skipped buffer flushing.');
            } else {
                this.hlsInstance.once(Hls.Events.BUFFER_FLUSHED, function (this: HlsPlayer) {
                    this.media.currentTime = timestamp;
                    this.hlsInstance.startLoad(timestamp);
                    this.onScreenConsoleOutput('Buffer reloaded.');
                }.bind(this));
                this.hlsInstance.trigger(Hls.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: null });
                this.onScreenConsoleOutput('Buffer flushed.');
            }
        } else {
            super.seek(timestamp);
        }
    }
}