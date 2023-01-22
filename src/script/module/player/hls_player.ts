import { NonNativePlayer } from './non-native-player';
import { remove } from '../dom';
import Hls from 'hls.js';
import type { Events, ErrorData, FragChangedData, ManifestParsedData, HlsConfig } from 'hls.js';

export class HlsPlayer extends NonNativePlayer {
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

    protected attach(this: HlsPlayer, onload?: (...args: any[]) => void, onerror?: (...args: any[]) => void): void {
        this.preattach();

        this.hlsInstance.on(Hls.Events.ERROR, function (this: any, event: Events.ERROR, data: ErrorData) {
            onerror && onerror.call(this, event, data);
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
            onerror?: (...args: any[]) => void;
            onplaypromiseerror?: () => void;
        }
    ): void {
        config = config ?? {};

        if (!this.attached) {
            this.attach(config.onload, config.onerror);
            this.onPlayPromiseError = config.onplaypromiseerror;
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