import { w } from '../dom/window';
import { allAnimationFrames } from './internal/all_animation_frames';
import type { AnimationFrame } from './type';

export function removeAnimationFrame(animationFrame: AnimationFrame): void {
    if (allAnimationFrames.delete(animationFrame)) {
        w.cancelAnimationFrame(animationFrame);
        if (ENABLE_DEBUG) {
            console.log(`Animation frame removed. Total animation frames: ${allAnimationFrames.size}.`, animationFrame);
        }
    } else if (ENABLE_DEBUG) {
        console.error('Animation frame not found.', animationFrame);
    }
}
