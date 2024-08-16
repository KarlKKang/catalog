import { w } from '../dom/window';
import { allAnimationFrames } from './internal/all_animation_frames';

export function requestAnimationFrame(callback: FrameRequestCallback) {
    const animationFrame = w.requestAnimationFrame((...args: Parameters<FrameRequestCallback>) => {
        if (allAnimationFrames.delete(animationFrame)) {
            callback(...args);
        }
    });
    allAnimationFrames.add(animationFrame);
    return animationFrame;
}
