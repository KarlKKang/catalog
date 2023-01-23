import { NonNativePlayer } from './non-native-player';
import { remove } from '../dom';
import { MediaPlayer } from 'dashjs';

export class DashPlayer extends NonNativePlayer {
    private readonly dashjsInstance: dashjs.MediaPlayerClass;

    constructor(
        container: HTMLDivElement,
        dashjsConfig: dashjs.MediaPlayerSettingClass,
        config?: {
            audio?: boolean;
            debug?: boolean;
        }
    ) {
        super(container, config);
        this.dashjsInstance = MediaPlayer().create();
        this.dashjsInstance.initialize();
        this.dashjsInstance.updateSettings(dashjsConfig);
        this.dashjsInstance.setAutoPlay(false);
        this.dashjsInstance.setXHRWithCredentialsForType('InitializationSegment', true);
        this.dashjsInstance.setXHRWithCredentialsForType('MediaSegment', true);
    }

    protected attach(this: DashPlayer, onload?: (...args: any[]) => void, onerror?: (...args: any[]) => void): void {
        this.preattach();
        this.dashjsInstance.on('error', function (this: any, event: dashjs.ErrorEvent) {
            onerror && onerror.call(this, event);
        });
        this.dashjsInstance.on('manifestLoaded', function (this: any, event: dashjs.ManifestLoadedEvent) {
            onload && onload.call(this, event);
        });
        this.dashjsInstance.attachView(this.media);
        this.media.volume = 1;
        this.onScreenConsoleOutput('dashjs is attached.');
    }

    public load(
        this: DashPlayer,
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

        const callback = function (this: DashPlayer) {
            this.dashjsInstance.off('manifestLoaded', callback);
            if (startTime !== undefined) {
                this.seek(startTime);
            }
            if (play) {
                this.play();
            }
        }.bind(this);

        this.dashjsInstance.on('manifestLoaded', callback);
        this.dashjsInstance.attachSource(url);
        this.onScreenConsoleOutput('dashjs source loaded.');
    }

    public destroy(this: DashPlayer) {
        this.timer && clearInterval(this.timer);
        this.dashjsInstance.destroy();
        remove(this.controls);
    }
}