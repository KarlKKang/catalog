import { w } from '../dom/window';
import { allAnimationFrames } from './internal/all_animation_frames';

export function offloadAnimationFrames() {
    for (const animationFrame of allAnimationFrames) {
        w.cancelAnimationFrame(animationFrame);
    }
    allAnimationFrames.clear();
}
