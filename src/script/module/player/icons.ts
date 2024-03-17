import { addClass, createSVGElement } from '../dom';
import { playerFullscreenEnterIcon, playerFullscreenExitIcon, playerPauseIcon, playerPictureInPictureEnterIcon, playerPictureInPictureExitIcon, playerPlayIcon, playerReplayIcon } from '../../../css/player.module.scss';

const viewBox = '0 0 1802 1792';

export function getPlayIcon() {
    const playIcon = createSVGElement(viewBox, 'm599.05,1419V373s905.86,523,905.86,523l-905.86,523Z');
    addClass(playIcon, playerPlayIcon);
    return playIcon;
}

export function getPauseIcon() {
    const pauseIcon = createSVGElement(viewBox, 'm453,1419h299V373h-299v1046ZM1050,373v1046h299V373h-299Z');
    addClass(pauseIcon, playerPauseIcon);
    return pauseIcon;
}

export function getReplayIcon() {
    const replayIcon = createSVGElement(viewBox, 'm901,503.09V242.03l-326.77,326.77,326.77,326.77v-261.06c71.25,0,137.25,17.81,197.99,53.44,59.57,34.46,106.59,81.47,141.04,141.04,35.63,60.74,53.44,126.59,53.44,197.55s-17.81,137.1-53.44,198.42c-34.46,58.99-81.47,106-141.04,141.04-60.74,35.63-126.73,53.44-197.99,53.44s-137.25-17.81-197.99-53.44c-59.57-35.04-106.59-82.06-141.04-141.04-35.63-61.32-53.44-127.32-53.44-197.99h-130.53c0,70.67,13.72,138.42,41.17,203.24,26.28,62.49,63.51,117.97,111.7,166.45,48.18,48.47,103.52,85.85,166.01,112.13,64.83,27.45,132.87,41.17,204.12,41.17s139.29-13.72,204.12-41.17c62.49-26.28,117.83-63.66,166.01-112.13,48.18-48.47,85.41-103.96,111.7-166.45,27.45-64.83,41.17-132.72,41.17-203.68s-13.72-138.85-41.17-203.68c-26.28-62.49-63.51-117.83-111.7-166.01-48.18-48.18-103.52-85.71-166.01-112.57-64.83-27.45-132.87-41.17-204.12-41.17Z');
    addClass(replayIcon, playerReplayIcon);
    return replayIcon;
}

export function getCircle() {
    const circle = createSVGElement(viewBox, 'm1424,896c0,288.84-234.16,523-523,523s-523-234.16-523-523,234.16-523,523-523,523,234.16,523,523Z');
    return circle;
}

export function getFullscreenEnterIcon() {
    const fullscreenEnterIcon = createSVGElement(viewBox, 'm528,1045h-150v374h374v-150h-224v-224Zm-150-298h150v-224h224v-150h-374v374Zm896,522h-224v150h374v-374h-150v224Zm-224-896v150h224v224h150v-374h-374Z');
    addClass(fullscreenEnterIcon, playerFullscreenEnterIcon);
    return fullscreenEnterIcon;
}

export function getFullscreenExitIcon() {
    const fullscreenExitIcon = createSVGElement(viewBox, 'm378,1195h224v224h150v-374h-374v150Zm224-598h-224v150h374v-374h-150v224Zm448,822h150v-224h224v-150h-374v374Zm150-822v-224h-150v374h374v-150h-224Z');
    addClass(fullscreenExitIcon, playerFullscreenExitIcon);
    return fullscreenExitIcon;
}

export function getPIPEnterIcon() {
    const PIPEnterIcon = createSVGElement(viewBox, 'm1308.04,837.63h-465.41v348.67h465.41v-348.67Zm231.93,465.41V488.18c0-21.27-5.19-40.6-15.57-57.98-10.38-17.38-24.52-31.26-42.42-41.64-17.9-10.38-37.23-15.57-57.98-15.57H378c-20.75,0-40.08,5.19-57.98,15.57-17.9,10.38-32.04,24.26-42.42,41.64s-15.57,36.71-15.57,57.98v814.85c0,20.75,5.19,40.08,15.57,57.98s24.52,32.04,42.42,42.42,37.23,15.57,57.98,15.57h1046c20.75,0,40.08-5.19,57.98-15.57,17.9-10.38,32.04-24.52,42.42-42.42,10.38-17.9,15.57-37.23,15.57-57.98Zm-115.96.78H378V487.41h1046v816.41Z');
    addClass(PIPEnterIcon, playerPictureInPictureEnterIcon);
    return PIPEnterIcon;
}

export function getPIPExitIcon() {
    const PIPExitIcon = createSVGElement(viewBox, 'm1307.72,605.31H494.28v581.37h813.44v-581.37Zm232.24,697.53V487.99c0-21.01-5.15-40.28-15.46-57.79-10.31-17.51-24.41-31.42-42.31-41.73-17.89-10.31-37.35-15.47-58.35-15.47H378.16c-21.01,0-40.36,5.16-58.06,15.47-17.7,10.31-31.8,24.22-42.31,41.73-10.5,17.51-15.76,36.77-15.76,57.79v814.85c0,21.01,5.25,40.37,15.76,58.08,10.5,17.71,24.61,31.81,42.31,42.32,17.7,10.51,37.05,15.76,58.06,15.76h1045.68c21.01,0,40.36-5.25,58.06-15.76,17.7-10.51,31.8-24.61,42.31-42.32,10.5-17.71,15.76-37.07,15.76-58.08Zm-116.12,1.17H378.16V487.41h1045.68v816.6Z');
    addClass(PIPExitIcon, playerPictureInPictureExitIcon);
    return PIPExitIcon;
}