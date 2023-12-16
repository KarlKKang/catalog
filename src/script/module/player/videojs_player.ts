import { NonNativePlayer } from './non-native-player';
import { default as videojs } from 'video.js';
import {
    prependChild,
    remove,
} from '../dom';
import { mediaErrorCodeLookup } from './media_error';

export class VideojsPlayer extends NonNativePlayer {
    private readonly videojsInstance: videojs.Player;
    private destroyed = false;

    private onVideojsError: undefined | (() => void) = undefined;
    private onVideojsLoadedMetadata: undefined | ((...args: any[]) => void) = undefined;

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

    protected attach(this: VideojsPlayer, onload: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void {
        this.preattach();

        this.onVideojsError = () => {
            if (this.destroyed) {
                return;
            }
            const mediaError = this.videojsInstance.error();
            onerror && onerror(mediaErrorCodeLookup(mediaError));  // videojs mimics the standard HTML5 `MediaError` class.
            console.error(mediaError);
        };
        this.videojsInstance.on('error', this.onVideojsError);

        this.onVideojsLoadedMetadata = (...args: any[]) => {
            if (this.destroyed) {
                return;
            }
            this.onVideojsLoadedMetadata = undefined;
            onload(...args);
        };
        this.videojsInstance.one('loadedmetadata', this.onVideojsLoadedMetadata);

        this.videojsInstance.volume(1);
        DEVELOPMENT && this.log?.('Videojs is attached.');
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
        const play = config.play === true;
        const startTime = config.startTime;

        if (!this.attached) {
            const onload = config.onload;
            this.attach((...args: any[]) => {
                if (startTime !== undefined) {
                    this.seek(startTime);
                }
                if (play) {
                    this.play();
                }
                onload && onload(...args);
            }, config.onerror);
        }

        this.videojsInstance.src({
            src: url,
            type: 'application/vnd.apple.mpegurl'
        });
        DEVELOPMENT && this.log?.('Videojs source loaded.');
    }

    protected disattach(this: VideojsPlayer) {
        this.destroyed = true;
        this.onVideojsError && this.videojsInstance.off('error', this.onVideojsError);
        this.onVideojsLoadedMetadata && this.videojsInstance.off('loadedmetadata', this.onVideojsLoadedMetadata);
        this.videojsInstance.dispose();
    }
}