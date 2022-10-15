import { Player } from './player';
import {
    addClass,
    removeClass,
    addEventsListener,
    removeEventsListener,
} from '../DOM';
import type { default as videojs } from 'video.js';

export abstract class NonNativePlayer extends Player {
    private buffering = false;

    constructor(
        instance: videojs.Player,
        config?: {
            audio?: boolean,
            debug?: boolean
        }
    ) {
        super(instance, config);
        this.checkBuffer = this.checkBuffer.bind(this);
    }

    protected abstract override attach(this: NonNativePlayer, onload?: (...args: any[]) => void, onerror?: (...args: any[]) => void): void;
    public abstract override load(
        this: Player,
        url: string,
        config?: {
            play?: boolean,
            startTime?: number,
            onload?: (...args: any[]) => void,
            onerror?: (...args: any[]) => void
        }
    ): void;
    public abstract override destroy(this: NonNativePlayer): void;

    public override play(this: NonNativePlayer) {
        if (this.IS_VIDEO) {
            this.onplay();
        } else {
            this.media.play();
        }
    }

    public override pause(this: NonNativePlayer) {
        if (this.IS_VIDEO) {
            this.playing = false;
            super.onpause();
        }
        this.media.pause();
    }

    private checkBuffer = function (this: NonNativePlayer, event?: Event) {
        if (this.buffering === false) {
            return;
        }
        for (let i = this.media.buffered.length - 1; i >= 0; i--) {
            if (this.media.buffered.start(i) <= this.media.currentTime + 0.1) {
                this.onScreenConsoleOutput('Checking buffer range :' + this.media.buffered.start(i) + '-' + this.media.buffered.end(i) + '. Current time: ' + this.media.currentTime);
                if (this.media.buffered.end(i) >= Math.min(this.media.currentTime + 15, this.media.duration - 0.1)) {
                    removeEventsListener(this.media, ['progress', 'play', 'timeupdate'], this.checkBuffer);
                    removeClass(this.controls, 'vjs-seeking');
                    this.buffering = false;
                    this.onScreenConsoleOutput('Buffer complete!');
                    if (this.playing && !this.dragging) {
                        this.media.play();
                    }
                    return;
                } else {
                    setTimeout(this.checkBuffer, 1000); // To prevent 'progress' event not firing sometimes
                    break;
                }
            }
        }
        if (event !== undefined && (event.type == 'playing' || (!this.media.paused && event.type == 'timeupdate'))) {
            this.media.pause();
        }
    }

    private startBuffer(this: NonNativePlayer) {
        if (this.buffering) {
            this.checkBuffer();
            return;
        }

        const addCheckBuffer = function (this: NonNativePlayer) {
            /*if (!media.paused && media.readyState>2) {
                media.pause();
            }*/
            this.buffering = true;
            addClass(this.controls, 'vjs-seeking');
            addEventsListener(this.media, ['progress', 'playing', 'timeupdate'], this.checkBuffer);
            this.checkBuffer();
        }.bind(this);

        if (this.media.buffered.length == 0) {
            addCheckBuffer();
            this.onScreenConsoleOutput('Buffer empty, start buffering.');
        } else {
            for (let i = this.media.buffered.length - 1; i >= 0; i--) {
                if (this.media.buffered.start(i) <= this.media.currentTime + 0.1) {
                    if (this.media.buffered.end(i) < Math.min(this.media.currentTime + 14.9, this.media.duration - 0.1)) {
                        addCheckBuffer();
                        this.onScreenConsoleOutput('Buffer under threshold, start buffering.');
                    } else {
                        this.onScreenConsoleOutput('Buffer above threshold.');
                        if (this.playing && !this.dragging) {
                            this.media.play();
                        }
                    }
                    return;
                }
            }
        }
    }

    protected override onloadedmetadata(this: NonNativePlayer): void {
        super.onloadedmetadata();
        if (this.IS_VIDEO) {
            this.startBuffer();
        }
    }

    protected override ondragended(this: NonNativePlayer, event: MouseEvent | TouchEvent): void {
        const playing = this.playing;
        super.ondragended(event);
        if (this.IS_VIDEO) {
            this.playing = playing;
        }
    }

    protected override onplay(this: NonNativePlayer): void {
        super.onplay();
        if (this.IS_VIDEO) {
            this.playing = true;
            this.startBuffer();
        }
    }

    protected override onpause(this: NonNativePlayer): void {
        if (this.IS_VIDEO) {
            if (!this.buffering) {
                this.playing = false;
                super.onpause();
            }
        } else {
            super.onpause();
        }
    }

    protected override onended(this: NonNativePlayer): void {
        if (this.IS_VIDEO) {
            this.playing = false;
        }
        super.onended();
    }

    protected override oncanplaythrough(this: NonNativePlayer): void {
        this.onScreenConsoleOutput('Playback can play through at ' + this.media.currentTime + '.');

        if (!this.buffering) {
            removeClass(this.controls, 'vjs-seeking');
        }
        if (this.playing) {
            this.play();
        }
    }

    protected override onwaiting(this: NonNativePlayer): void {
        super.onwaiting();
        if (this.IS_VIDEO) {
            this.startBuffer();
        }
    }
}