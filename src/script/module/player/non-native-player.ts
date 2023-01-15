import { Player } from './player';
import {
    addEventsListener,
    removeEventsListener,
} from '../DOM';
import { addPlayerClass, containsPlayerClass, removePlayerClass } from './helper';

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

    protected abstract override attach(this: NonNativePlayer, onload?: (...args: any[]) => void, onerror?: (...args: any[]) => void): void;
    public abstract override load(
        this: Player,
        url: string,
        config?: {
            play?: boolean;
            startTime?: number;
            onload?: (...args: any[]) => void;
            onerror?: (...args: any[]) => void;
            onplaypromiseerror?: () => void;
        }
    ): void;
    public abstract override destroy(this: NonNativePlayer): void;

    public override play(this: NonNativePlayer) {
        if (this.IS_VIDEO) {
            if (!containsPlayerClass(this.controls, 'has-started')) {
                this.onScreenConsoleOutput('Initial play triggered.');
                const currentTime = this.media.currentTime;
                const playPromise = this.media.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => this.onScreenConsoleOutput('Initial play promise rejected. (This is harmless)')); // Some browsers will reject the initial play request if it is not from a user action.
                }
                this.media.pause();
                this.seek(currentTime);
            }
            this.onplay();
        } else {
            super.play();
        }
    }

    public override pause(this: NonNativePlayer, setStatus = true) {
        if (this.IS_VIDEO && setStatus) {
            this.playing = false;
        }
        super.pause();
    }

    protected override togglePlayback(this: NonNativePlayer) {
        if (containsPlayerClass(this.controls, 'playing')) {
            this.IS_VIDEO && this.onpause(true); // onpause will not fire if the user pauses the video before the video finishes buffering.
            this.pause();
        } else {
            this.play();
        }
    }

    private checkBuffer(this: NonNativePlayer) {
        if (this.buffering === false) {
            return;
        }

        const bufferedRange = this.getBufferedRange();
        for (const buffer of bufferedRange) {
            if (this.media.currentTime < buffer.end) {
                this.onScreenConsoleOutput('Checking buffer range :' + buffer.start + '-' + buffer.end + '. Current time: ' + this.media.currentTime);
                if (buffer.start <= this.media.currentTime + 0.1 && buffer.end >= Math.min(this.media.currentTime + 15, this.media.duration - 0.1)) {
                    removeEventsListener(this.media, ['progress', 'play', 'timeupdate'], this.checkBuffer);
                    removePlayerClass(this.controls, 'seeking');
                    this.buffering = false;
                    this.onScreenConsoleOutput('Buffer complete!');
                    if (this.playing && !this.dragging) {
                        super.play();
                    }
                    return;
                }
                break;
            }
        }

        setTimeout(this.checkBuffer, 1000); // To prevent 'progress' event not firing sometimes
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
            addCheckBuffer();
            this.onScreenConsoleOutput('Buffer empty, start buffering.');
        } else {
            for (const buffer of bufferedRange) {
                if (this.media.currentTime < buffer.end) {
                    if (buffer.start > this.media.currentTime + 0.1 || buffer.end < Math.min(this.media.currentTime + 14.9, this.media.duration - 0.1)) {
                        addCheckBuffer();
                        this.onScreenConsoleOutput('Buffer under threshold, start buffering.');
                    } else {
                        this.onScreenConsoleOutput('Buffer above threshold.');
                        if (this.playing && !this.dragging) {
                            super.play();
                        }
                    }
                    return;
                }
            }
            addCheckBuffer();
            this.onScreenConsoleOutput('No buffer beyond current position, start buffering.');
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

    protected override onpause(this: NonNativePlayer, forceStatusChange = false): void {
        if (this.IS_VIDEO) {
            if (!this.buffering || forceStatusChange) {
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