import { NonNativePlayer } from './non-native-player';
import type { default as videojs } from 'video.js';
import {
    getDescendantsByTagAt,
    remove,
} from '../DOM';

export class VideojsPlayer extends NonNativePlayer {
    private readonly videojsInstance: videojs.Player;

    constructor(
        controlInstance: videojs.Player,
        mediaInstance: videojs.Player,
        config?: {
            audio?: boolean,
            debug?: boolean
        }
    ) {
        super(controlInstance, config);
        this.videojsInstance = mediaInstance;

        remove(this._media);
        this._media = this.IS_VIDEO ? (getDescendantsByTagAt(this.videojsInstance.el(), 'video', 0) as HTMLVideoElement) : (getDescendantsByTagAt(this.videojsInstance.el(), 'audio', 0) as HTMLAudioElement);
    }

    protected attach(this: VideojsPlayer, onload?: (...args: any[]) => void, onerror?: (...args: any[]) => void): void {
        this.preattach();

        this.videojsInstance.on('error', function (this: any, ...args: any[]) {
            if (onerror !== undefined) {
                onerror.apply(this, args);
            }
        });
        this.videojsInstance.on('loadedmetadata', function (this: any, ...args: any[]) {
            if (onload !== undefined) {
                onload.apply(this, args);
            }
        });
        this.videojsInstance.volume(1);
        this.onScreenConsoleOutput('Videojs is attached.');
    }

    public load(
        this: VideojsPlayer,
        url: string,
        config?: {
            play?: boolean | undefined,
            startTime?: number | undefined,
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

        const callback = function (this: VideojsPlayer) {
            if (startTime !== undefined) {
                this.seek(startTime);
            }
            if (play) {
                this.play();
            }
        }.bind(this);

        this.pause();
        this.videojsInstance.one('loadedmetadata', callback);
        this.videojsInstance.src({
            src: url,
            type: 'application/vnd.apple.mpegurl'
        });
        this.onScreenConsoleOutput('Videojs source loaded.');
    }

    public destroy(this: VideojsPlayer) {
        this.timer && clearInterval(this.timer);
        this.videojsInstance.dispose();
        remove(this.controls);
    }
}