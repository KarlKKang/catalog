import { MSE_SUPPORTED } from '../mse/supported';
import { NATIVE_HLS_SUPPORTED } from '../native_hls_supported';
import { createAudioElement } from '../../dom/element/audio/create';
import { createVideoElement } from '../../dom/element/video/create';
import { getMediaSource } from '../internal/hls/get_media_source';

export function canPlay(type: 'video' | 'audio', container: string, codecs: string): boolean {
    if (codecs !== '') {
        codecs = `; codecs="${codecs}"`;
    }
    const mediaSource = getMediaSource();
    if (MSE_SUPPORTED && mediaSource !== undefined) {
        return mediaSource.isTypeSupported(`${type}/${container}${codecs}`);
    } else if (NATIVE_HLS_SUPPORTED) {
        let mediaElement: HTMLMediaElement;
        if (type === 'video') {
            mediaElement = createVideoElement();
        } else {
            mediaElement = createAudioElement();
        }
        return mediaElement.canPlayType(`${type}/${container}${codecs}`) !== '';
    }
    return false;
}
