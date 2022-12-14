import { NonNativePlayer } from './non-native-player';
import type { default as videojs } from 'video.js';
import {
    prependChild,
    remove,
} from '../DOM';

export class VideojsPlayer extends NonNativePlayer {
    private readonly videojsInstance: videojs.Player;

    constructor(
        container: HTMLDivElement,
        videojsConstructor: typeof videojs,
        videojsConfig: videojs.PlayerOptions,
        config?: {
            audio?: boolean,
            debug?: boolean
        }
    ) {
        super(container, config);
        this.videojsInstance = videojsConstructor(this.media, videojsConfig);
        prependChild(container, this.media);
        remove(this.videojsInstance.el());
    }

    protected attach(this: VideojsPlayer, onload?: (...args: any[]) => void, onerror?: (...args: any[]) => void): void {
        this.preattach();

        this.videojsInstance.on('error', function (this: any, ...args: any[]) {
            onerror && onerror.apply(this, args);
        });
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
            play?: boolean | undefined,
            startTime?: number | undefined,
            onload?: (...args: any[]) => void,
            onerror?: (...args: any[]) => void
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