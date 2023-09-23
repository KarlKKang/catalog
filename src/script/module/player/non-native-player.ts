import { Player } from './player';
import {
    addEventsListener,
    removeEventsListener,
} from '../dom';
import { addPlayerClass, containsPlayerClass, removePlayerClass } from './helper';
import { addTimeout } from '../timer';

export abstract class NonNativePlayer extends Player {
    private buffering = false;

    constructor(
        container: HTMLDivElement,
        config?: {
            audio?: boolean;
            debug?: boolean;
        }
    ) {
        super(container, config);
        this.checkBuffer = this.checkBuffer.bind(this);
    }

    protected abstract override attach(this: NonNativePlayer, onload?: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void;
    public abstract override load(
        this: Player,
        url: string,
        config?: {
            play?: boolean;
            startTime?: number;
            onload?: (...args: any[]) => void;
            onerror?: (errorCode: number | null) => void;
        }
    ): void;
    protected abstract override disattach(this: NonNativePlayer): void;

    public override play(this: NonNativePlayer) {
        if (this.IS_VIDEO) {
            if (!containsPlayerClass(this.controls, 'has-started')) {
                DEVELOPMENT && this.log?.('Initial play triggered.');
                const currentTime = this.media.currentTime;
                const playPromise = this.media.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => DEVELOPMENT && this.log?.('Initial play promise rejected. (This is harmless)')); // Some browsers will reject the initial play request if it is not from a user action.
                }
                this.media.pause();
                this.seek(currentTime);
            }
            this.onplay();
        } else {
            super.play();
        }
    }

    private checkBuffer(this: NonNativePlayer) {
        if (!this.buffering) {
            return;
        }

        const endBuffer = () => {
            removeEventsListener(this.media, ['progress', 'playing', 'timeupdate'], this.checkBuffer);
            removePlayerClass(this.controls, 'seeking');
            this.buffering = false;
        };

        const bufferedRange = this.getBufferedRange();
        if (bufferedRange.length == 0 && this.media.currentTime >= this.media.duration - this.maxBufferHole) {
            endBuffer();
            this.ended = true;
        }
        for (const buffer of bufferedRange) {
            if (this.media.currentTime < buffer.end) {
                DEVELOPMENT && this.log?.('Checking buffer range :' + buffer.start + '-' + buffer.end + '. Current time: ' + this.media.currentTime);
                if (buffer.start <= this.media.currentTime + this.maxBufferHole && buffer.end >= Math.min(this.media.currentTime + 15, this.media.duration - this.maxBufferHole)) {
                    endBuffer();
                    DEVELOPMENT && this.log?.('Buffer complete!');
                    if (this.playing && !this.dragging) {
                        super.play();
                    }
                    return;
                }
                break;
            }
        }

        addTimeout(this.checkBuffer, 1000); // To prevent 'progress' event not firing sometimes
        this.pause(false);
    }

    private startBuffer(this: NonNativePlayer) {
        if (this.buffering) {
            this.checkBuffer();
            return;
        }

        const addCheckBuffer = () => {
            this.buffering = true;
            addPlayerClass(this.controls, 'seeking');
            addEventsListener(this.media, ['progress', 'playing', 'timeupdate'], this.checkBuffer);
            this.checkBuffer();
        };

        const bufferedRange = this.getBufferedRange();
        if (bufferedRange.length == 0) {
            if (this.media.currentTime >= this.media.duration - this.maxBufferHole) { // Media should be ended when it's near the end there's no more buffer.
                this.ended = true;
            } else {
                addCheckBuffer();
                DEVELOPMENT && this.log?.('Buffer empty, start buffering.');
            }
        } else {
            for (const buffer of bufferedRange) {
                if (this.media.currentTime < buffer.end) {
                    if (buffer.start > this.media.currentTime + this.maxBufferHole || buffer.end < Math.min(this.media.currentTime + 14.9, this.media.duration - this.maxBufferHole)) {
                        addCheckBuffer();
                        DEVELOPMENT && this.log?.('Buffer under threshold, start buffering.');
                    } else {
                        DEVELOPMENT && this.log?.('Buffer above threshold.');
                        if (this.playing && !this.dragging) {
                            super.play();
                        }
                    }
                    return;
                }
            }
            addCheckBuffer();
            DEVELOPMENT && this.log?.('No buffer beyond current position, start buffering.');
        }
    }

    protected override onloadedmetadata(this: NonNativePlayer): void {
        super.onloadedmetadata();
        if (this.IS_VIDEO) {
            this.startBuffer();
        }
    }

    protected override onplay(this: NonNativePlayer): void {
        super.onplay();
        if (this.IS_VIDEO) {
            this.startBuffer();
        }
    }

    protected override onpause(this: NonNativePlayer): void {
        if (this.IS_VIDEO) {
            if (!this.buffering) {
                super.onpause();
            }
        } else {
            super.onpause();
        }
    }

    protected override oncanplaythrough(this: NonNativePlayer): void {
        DEVELOPMENT && this.log?.('Playback can play through at ' + this.media.currentTime + '.');

        if (!this.buffering) {
            removePlayerClass(this.controls, 'seeking');
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