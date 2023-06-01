import { NonNativePlayer } from './non-native-player';
import { default as videojs } from 'video.js';
import {
    prependChild,
    remove,
} from '../dom';

export class VideojsPlayer extends NonNativePlayer {
    private readonly videojsInstance: videojs.Player;

    constructor(
        container: HTMLDivElement,
        videojsConfig: videojs.PlayerOptions,
        config?: {
            audio?: boolean;
            debug?: boolean;
        }
    ) {
        super(container, config);
        this.videojsInstance = videojs(this.media, videojsConfig);
        prependChild(container, this.media);
        remove(this.videojsInstance.el());
    }

    protected attach(this: VideojsPlayer, onload?: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this.preattach();

        this.videojsInstance.on('error', function (this: VideojsPlayer) {
            const mediaError = this.videojsInstance.error();
            onerror && onerror(mediaError === null ? null : mediaError.code);  // videojs mimics the standard HTML5 `MediaError` class.
            console.error(mediaError);
        }.bind(this));
        this.videojsInstance.on('loadedmetadata', function (this: any, ...args: any[]) {
            onload && onload.apply(this, args);
        });
        this.videojsInstance.volume(1);
        this.onScreenConsoleOutput('Videojs is attached.');
    }

    public load(
        this: VideojsPlayer,
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

        const callback = function (this: VideojsPlayer) {
            if (startTime !== undefined) {
                this.seek(startTime);
            }
            if (play) {
                this.play();
            }
        }.bind(this);

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