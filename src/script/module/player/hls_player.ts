import { NonNativePlayer } from "./non-native-player";
import { remove } from "../DOM";
import type Hls from 'hls.js';
import type { default as videojs } from 'video.js';
import type { Events, ErrorData, FragChangedData, ManifestParsedData } from "hls.js";

export class HlsPlayer extends NonNativePlayer {
    private readonly hlsInstance: Hls;
    private readonly hlsConstructor: typeof Hls;
    private fragStart = 0;

    constructor(
        instance: videojs.Player,
        hlsInstance: Hls,
        hlsConstructor: typeof Hls,
        config?: {
            audio?: boolean,
            debug?: boolean
        }
    ) {
        super(instance, config);
        this.hlsInstance = hlsInstance;
        this.hlsConstructor = hlsConstructor;
    }

    protected attach(this: HlsPlayer, onload?: (...args: any[]) => void, onerror?: (...args: any[]) => void): void {
        this.preattach();

        this.hlsInstance.on(this.hlsConstructor.Events.ERROR, function (this: any, event: Events.ERROR, data: ErrorData) {
            if (onerror !== undefined) {
                onerror.call(this, event, data);
            }
        });
        this.hlsInstance.on(this.hlsConstructor.Events.MANIFEST_PARSED, function (this: any, event: Events.MANIFEST_PARSED, data: ManifestParsedData) {
            if (onload !== undefined) {
                onload.call(this, event, data);
            }
        });
        this.hlsInstance.on(this.hlsConstructor.Events.FRAG_CHANGED, function (this: HlsPlayer, _: Events.FRAG_CHANGED, data: FragChangedData) {
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
            play?: boolean,
            startTime?: number,
            onload?: (...args: any[]) => void,
            onerror?: (...args: any[]) => void
        }
    ): void {
        if (config === undefined) {
            config = {};
        }

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

        this.pause();
        this.hlsInstance.once(this.hlsConstructor.Events.MANIFEST_PARSED, callback);
        this.hlsInstance.loadSource(url);
        this.onScreenConsoleOutput('HLS source loaded.');
    }

    public destroy(this: HlsPlayer) {
        this.hlsInstance.destroy();
        remove(this.controls);
    }

    public override seek(this: HlsPlayer, timestamp: number) {
        if (this.IS_VIDEO) {
            if (timestamp >= this.fragStart) {
                this.media.currentTime = timestamp;
                this.onScreenConsoleOutput('Skipped buffer flushing.');
            } else {
                this.hlsInstance.once(this.hlsConstructor.Events.BUFFER_FLUSHED, function (this: HlsPlayer) {
                    this.media.currentTime = timestamp;
                    this.hlsInstance.startLoad(timestamp);
                    this.onScreenConsoleOutput('Buffer reloaded.');
                }.bind(this));
                this.hlsInstance.trigger(this.hlsConstructor.Events.BUFFER_FLUSHING, { startOffset: 0, endOffset: Number.POSITIVE_INFINITY, type: null });
                this.onScreenConsoleOutput('Buffer flushed.');
            }
        } else {
            super.seek(timestamp);
        }
    }
}