import { w } from '../dom/window';
import { allAnimationFrames } from './internal/all_animation_frames';

export function addAnimationFrame(callback: FrameRequestCallback) {
    const animationFrame = w.requestAnimationFrame((...args: Parameters<FrameRequestCallback>) => {
        if (allAnimationFrames.delete(animationFrame)) {
            if (DEVELOPMENT) {
                console.log(`Animation frame triggered. Total animation frames: ${allAnimationFrames.size}.`, animationFrame);
            }
            callback(...args);
        }
    });
    allAnimationFrames.add(animationFrame);
    if (DEVELOPMENT) {
        console.log(`Animation frame added. Total animation frames: ${allAnimationFrames.size}.`, animationFrame);
    }
    return animationFrame;
}
