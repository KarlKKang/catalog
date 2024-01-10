import { Player } from './player';
import {
    addEventsListener,
    removeEventsListener,
} from '../dom';
import { addPlayerClass, containsPlayerClass, removePlayerClass } from './helper';
import { addTimeout } from '../timer';

export abstract class NonNativePlayer extends Player {
    private buffering = false;
    private lastBufferUpdateTime = new Date().getTime();
    public onbufferstalled: (() => void) | undefined = undefined;

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
                    playPromise.catch(() => { DEVELOPMENT && this.log?.('Initial play promise rejected. (This is harmless)'); }); // Some browsers will reject the initial play request if it is not from a user action.
                }
                this.media.pause();
                this.seek(currentTime);
            }
            this.startBuffer();
        }
        super.play();
    }

    private checkBuffer(this: NonNativePlayer, event?: Event) {
        if (!this.buffering) {
            return;
        }

        const endBuffer = () => {
            removeEventsListener(this.media, ['progress', 'playing', 'timeupdate'], this.checkBuffer);
            removePlayerClass(this.controls, 'seeking');
            this.buffering = false;
        };

        const bufferedRange = this.getBufferedRange();
        if (bufferedRange.length === 0 && this.media.currentTime >= this.media.duration - this.maxBufferHole) {
            endBuffer();
            this.ended = true;
            return;
        }
        for (const buffer of bufferedRange) {
            if (this.media.currentTime < buffer.end) {
                DEVELOPMENT && this.log?.('Checking buffer range :' + buffer.start + '-' + buffer.end + '. Current time: ' + this.media.currentTime);
                if (buffer.start <= this.media.currentTime + this.maxBufferHole && buffer.end >= Math.min(this.media.currentTime + 15, this.media.duration - this.maxBufferHole)) {
                    endBuffer();
                    DEVELOPMENT && this.log?.('Buffer complete!');
                    if (!this.dragging) {
                        this.media.playbackRate = 1;
                    }
                    return;
                }
                break;
            }
        }

        if (event !== undefined) {
            this.lastBufferUpdateTime = new Date().getTime();
        } else if (this.lastBufferUpdateTime + 16000 <= new Date().getTime()) {
            DEVELOPMENT && this.log?.('Buffer stalled.');
            this.onbufferstalled?.();
        }

        addTimeout(this.checkBuffer, 1000); // To prevent 'progress' event not firing sometimes
        addPlayerClass(this.controls, 'seeking');
        this.media.playbackRate = 0;
    }

    private startBuffer(this: NonNativePlayer) {
        if (this.buffering) {
            this.checkBuffer();
            return;
        }

        this.buffering = true;
        this.lastBufferUpdateTime = new Date().getTime();
        addEventsListener(this.media, ['progress', 'playing', 'timeupdate'], this.checkBuffer);
        this.checkBuffer();
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

    protected override oncanplaythrough(this: NonNativePlayer): void {
        if (this.IS_VIDEO) {
            this.startBuffer();
        }
        if (!this.buffering) {
            super.oncanplaythrough();
        }
    }

    protected override onwaiting(this: NonNativePlayer): void {
        super.onwaiting();
        if (this.IS_VIDEO) {
            this.startBuffer();
        }
    }
}