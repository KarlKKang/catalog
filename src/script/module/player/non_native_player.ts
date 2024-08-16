import { Player } from './player';
import { removeEventsListener } from '../event_listener/remove/multiple_events';
import { addEventsListener } from '../event_listener/add/multiple_events';
import { addClass } from '../dom/class/add';
import { removeClass } from '../dom/class/remove';
import { addTimeout } from '../timer/add/timeout';
import { playerSeeking } from '../../../css/player.module.scss';
import { PlayerKey } from './player_key';
import { NonNativePlayerKey } from './non_native_player_key';
import { getEpochMs } from '../time/epoch_ms';
import { min } from '../math';
import type { Timeout } from '../timer/type';
import { removeTimeout } from '../timer/remove/timeout';

export abstract class NonNativePlayer extends Player {
    private [NonNativePlayerKey.BUFFERING] = false;
    private [NonNativePlayerKey.CHECK_BUFFER_TIMEOUTS] = new Set<Timeout>();
    private [NonNativePlayerKey.LAST_BUFFER_UPDATE_TIME] = getEpochMs();
    public [NonNativePlayerKey.ON_BUFFER_STALLED]: (() => void) | undefined = undefined;

    constructor(container: HTMLDivElement, isVideo: boolean) {
        super(container, isVideo);
        this[NonNativePlayerKey.CHECK_BUFFER] = this[NonNativePlayerKey.CHECK_BUFFER].bind(this);
    }

    protected abstract override[PlayerKey.ATTACH](this: NonNativePlayer, onload?: (...args: any[]) => void, onerror?: (errorCode: number | null) => void): void;

    public abstract override[PlayerKey.LOAD](
        this: Player,
        url: string,
        config?: {
            play?: boolean;
            startTime?: number;
            onload?: (...args: any[]) => void;
            onerror?: (errorCode: number | null) => void;
        }
    ): void;

    protected override[PlayerKey.DETACH](this: NonNativePlayer) {
        this[NonNativePlayerKey.CLEAR_CHECK_BUFFER_TIMEOUTS]();
    }

    public override[PlayerKey.PLAY](this: NonNativePlayer) {
        this[NonNativePlayerKey.START_BUFFER]();
        super[PlayerKey.PLAY]();
    }

    private [NonNativePlayerKey.CLEAR_CHECK_BUFFER_TIMEOUTS](this: NonNativePlayer) {
        for (const timeout of this[NonNativePlayerKey.CHECK_BUFFER_TIMEOUTS]) {
            removeTimeout(timeout);
        }
        this[NonNativePlayerKey.CHECK_BUFFER_TIMEOUTS].clear();
    }

    private [NonNativePlayerKey.CHECK_BUFFER](this: NonNativePlayer, event?: Event) {
        const endBuffer = () => {
            removeEventsListener(this[PlayerKey.MEDIA], ['progress', 'playing', 'timeupdate'], this[NonNativePlayerKey.CHECK_BUFFER]);
            this[NonNativePlayerKey.CLEAR_CHECK_BUFFER_TIMEOUTS]();
            removeClass(this[PlayerKey.CONTROLS], playerSeeking);
            this[NonNativePlayerKey.BUFFERING] = false;
        };

        const bufferedRange = this[PlayerKey.GET_BUFFERED_RANGE]();
        if (bufferedRange.length === 0 && this[PlayerKey.MEDIA].currentTime >= this[PlayerKey.MEDIA].duration - this[PlayerKey.MAX_BUFFER_HOLE]) {
            endBuffer();
            this[PlayerKey.ENDED] = true;
            return;
        }
        for (const buffer of bufferedRange) {
            if (this[PlayerKey.MEDIA].currentTime < buffer.end) {
                DEVELOPMENT && this[PlayerKey.LOG]?.('Checking buffer range :' + buffer.start + '-' + buffer.end + '. Current time: ' + this[PlayerKey.MEDIA].currentTime);
                if (buffer.start <= this[PlayerKey.MEDIA].currentTime + this[PlayerKey.MAX_BUFFER_HOLE] && buffer.end >= min(this[PlayerKey.MEDIA].currentTime + 15, this[PlayerKey.MEDIA].duration - this[PlayerKey.MAX_BUFFER_HOLE])) {
                    endBuffer();
                    DEVELOPMENT && this[PlayerKey.LOG]?.('Buffer complete!');
                    if (!this[PlayerKey.DRAGGING]) {
                        this[PlayerKey.MEDIA].playbackRate = 1;
                    }
                    return;
                }
                break;
            }
        }

        if (event !== undefined) {
            this[NonNativePlayerKey.LAST_BUFFER_UPDATE_TIME] = getEpochMs();
        } else if (this[NonNativePlayerKey.LAST_BUFFER_UPDATE_TIME] + 16000 <= getEpochMs()) {
            DEVELOPMENT && this[PlayerKey.LOG]?.('Buffer stalled.');
            this[NonNativePlayerKey.ON_BUFFER_STALLED]?.();
        }

        const timeout = addTimeout(() => {
            this[NonNativePlayerKey.CHECK_BUFFER_TIMEOUTS].delete(timeout);
            this[NonNativePlayerKey.CHECK_BUFFER]();
        }, 1000); // To prevent 'progress' event not firing sometimes
        this[NonNativePlayerKey.CHECK_BUFFER_TIMEOUTS].add(timeout);
        addClass(this[PlayerKey.CONTROLS], playerSeeking);
        this[PlayerKey.MEDIA].playbackRate = 0;
    }

    private [NonNativePlayerKey.START_BUFFER](this: NonNativePlayer) {
        if (!this[PlayerKey.IS_VIDEO] || this[NonNativePlayerKey.BUFFERING]) {
            return;
        }

        this[NonNativePlayerKey.BUFFERING] = true;
        this[NonNativePlayerKey.LAST_BUFFER_UPDATE_TIME] = getEpochMs();
        addEventsListener(this[PlayerKey.MEDIA], ['progress', 'playing', 'timeupdate'], this[NonNativePlayerKey.CHECK_BUFFER]);
        this[NonNativePlayerKey.CHECK_BUFFER]();
    }

    protected override[PlayerKey.ON_LOADED_METADATA](this: NonNativePlayer): void {
        super[PlayerKey.ON_LOADED_METADATA]();
        this[NonNativePlayerKey.START_BUFFER]();
    }

    protected override[PlayerKey.ON_PLAY](this: NonNativePlayer): void {
        super[PlayerKey.ON_PLAY]();
        this[NonNativePlayerKey.START_BUFFER]();
    }

    protected override[PlayerKey.ON_CAN_PLAY_THROUGH](this: NonNativePlayer): void {
        if (!this[NonNativePlayerKey.BUFFERING]) {
            super[PlayerKey.ON_CAN_PLAY_THROUGH]();
        }
    }

    protected override[PlayerKey.ON_WAITING](this: NonNativePlayer): void {
        super[PlayerKey.ON_WAITING]();
        this[NonNativePlayerKey.START_BUFFER]();
    }

    protected override[PlayerKey.ON_SEEKING](this: NonNativePlayer): void {
        super[PlayerKey.ON_SEEKING]();
        this[NonNativePlayerKey.START_BUFFER]();
    }
}
