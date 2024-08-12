import { audioCanPlay } from '../audio';

export const CAN_PLAY_FLAC = audioCanPlay('flac') || audioCanPlay('fLaC');
