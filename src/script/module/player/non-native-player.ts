import { Player } from './player';
import {
    addClass,
    addEventsListener,
    removeClass,
    removeEventsListener,
} from '../dom';
import { addTimeout } from '../timer';
import { playerSeeking } from '../../../css/player.module.scss';

export abstract class NonNativePlayer extends Player {
    private buffering = false;
    private lastBufferUpdateTime = new Date().getTime();
    public onbufferstalled: (() => void) | undefined = undefined;

    constructor(container: HTMLDivElement, isVideo: boolean) {
        super(container, isVideo);
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
    protected override detach(this: NonNativePlayer) {
        this.buffering = false;
    }

    public override play(this: NonNativePlayer) {
        this.startBuffer();
        super.play();
    }

    private checkBuffer(this: NonNativePlayer, event?: Event) {
        if (!this.buffering) {
            return;
        }

        const endBuffer = () => {
            removeEventsListener(this.media, ['progress', 'playing', 'timeupdate'], this.checkBuffer);
            removeClass(this.controls, playerSeeking);
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
        addClass(this.controls, playerSeeking);
        this.media.playbackRate = 0;
    }

    private startBuffer(this: NonNativePlayer) {
        if (!this.IS_VIDEO || this.buffering) {
            return;
        }

        this.buffering = true;
        this.lastBufferUpdateTime = new Date().getTime();
        addEventsListener(this.media, ['progress', 'playing', 'timeupdate'], this.checkBuffer);
        this.checkBuffer();
    }

    protected override onloadedmetadata(this: NonNativePlayer): void {
        super.onloadedmetadata();
        this.startBuffer();
    }

    protected override onplay(this: NonNativePlayer): void {
        super.onplay();
        this.startBuffer();
    }

    protected override oncanplaythrough(this: NonNativePlayer): void {
        if (!this.buffering) {
            super.oncanplaythrough();
        }
    }

    protected override onwaiting(this: NonNativePlayer): void {
        super.onwaiting();
        this.startBuffer();
    }

    protected override onseeking(this: NonNativePlayer): void {
        super.onseeking();
        this.startBuffer();
    }
}