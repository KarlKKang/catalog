import { createSVGElement } from '../../dom/element/svg/create';

const viewBox = '0 0 64 64';

export function getHomeIcon() {
    const homeIcon = createSVGElement(viewBox, 'm64,32L32,0,0,32l2.83,2.83,3.35-3.35v32.52h20.69v-4h0v-18.19h10.26v20.19h0v2h20.69V31.48l3.35,3.35,2.83-2.83Zm-10.18,28h-12.7v-22.19h-18.26v22.19h-12.69V27.48L32,5.66l21.82,21.82v32.52Z');
    return homeIcon;
}

export function getHomeFillIcon() {
    const homeFillIcon = createSVGElement(viewBox, 'm64,32l-2.83,2.83-3.35-3.35v32.52h-18.7v-4h0v-20.19h-14.26v22.19h0v2H6.18V31.48l-3.35,3.35L0,32,32,0l32,32Z');
    return homeFillIcon;
}

export function getNewsIcon() {
    const newsIcon = createSVGElement(viewBox, 'm64,64H0V12h64v52Zm-60-4h56V16H4v44Zm52-26H8v-14h48v14Zm-44-4h40v-6H12v6Zm44,26h-18v-18h18v18Zm-14-4h10v-10h-10v10Zm-8-12H8v4h26v-4Zm0,10H8v4h26v-4ZM56,6H8v4h48v-4ZM48,0H16v4h32V0Z');
    return newsIcon;
}

export function getNewsFillIcon() {
    const newsFillIcon = createSVGElement(viewBox, 'm52,30H12v-6h40v6Zm0,12h-10v10h10v-10Zm12-30v52H0V12h64Zm-30,38H8v4h26v-4Zm0-10H8v4h26v-4Zm22-2h-18v18h18v-18Zm0-18H8v14h48v-14Zm0-14H8v4h48v-4ZM48,0H16v4h32V0Z');
    return newsFillIcon;
}

export function getMyAccountIcon() {
    const myAccountIcon = createSVGElement(viewBox, 'm59.63,48.09l4.37-1.81-1.53-3.7-4.37,1.81c-.7-1.03-1.58-1.92-2.62-2.62l1.81-4.36-3.7-1.53-1.81,4.37c-1.22-.24-2.48-.24-3.7,0l-1.81-4.37-3.7,1.53,1.81,4.37c-1.03.7-1.92,1.58-2.62,2.62l-4.36-1.81-1.53,3.7,4.37,1.81c-.24,1.23-.24,2.48,0,3.7l-4.37,1.81,1.53,3.7,4.37-1.81c.7,1.03,1.58,1.92,2.62,2.62l-1.81,4.36,3.7,1.53,1.81-4.37c.61.12,1.23.18,1.85.18s1.24-.06,1.85-.18l1.81,4.37,3.7-1.53-1.81-4.37c1.03-.7,1.92-1.58,2.62-2.62l4.36,1.81,1.53-3.7-4.37-1.81c.24-1.23.24-2.48,0-3.7Zm-4.27,4.1c-.6,1.45-1.73,2.58-3.18,3.18-1.45.6-3.04.6-4.49,0-1.45-.6-2.58-1.73-3.18-3.18-.6-1.45-.6-3.04,0-4.49.6-1.45,1.73-2.58,3.18-3.18.72-.3,1.49-.45,2.25-.45s1.52.15,2.25.45c1.45.6,2.58,1.73,3.18,3.18.6,1.45.6,3.04,0,4.49Zm-22.37-22.65c4.5-2.83,7.51-7.84,7.51-13.54C40.5,7.18,33.32,0,24.5,0S8.5,7.18,8.5,16c0,5.69,3,10.69,7.49,13.53C6.66,32.99,0,41.98,0,52.5v11.5h4v-11.5c0-11.3,9.2-20.5,20.5-20.5,5.01,0,9.6,1.81,13.16,4.8,1-.93,2.1-1.75,3.29-2.44-2.3-2.09-5-3.73-7.96-4.82Zm-8.49-1.54c-6.62,0-12-5.38-12-12s5.38-12,12-12,12,5.38,12,12-5.38,12-12,12Z');
    return myAccountIcon;
}

export function getMyAccountFillIcon() {
    const myAccountFillIcon = createSVGElement(viewBox, 'm38.72,64H0v-11.5c0-10.53,6.65-19.51,15.98-22.97-4.49-2.83-7.48-7.82-7.48-13.53C8.5,7.16,15.66,0,24.5,0s16,7.16,16,16c0,5.71-3,10.7-7.5,13.54,2.96,1.1,5.66,2.74,7.96,4.82-5.39,3.11-9.02,8.92-9.02,15.59,0,5.69,2.65,10.76,6.78,14.06Zm20.92-12.21l4.37,1.81-1.53,3.7-4.36-1.81c-.7,1.03-1.58,1.92-2.62,2.62l1.81,4.37-3.7,1.53-1.81-4.37c-.61.12-1.23.18-1.85.18s-1.24-.06-1.85-.18l-1.81,4.37-3.7-1.53,1.81-4.36c-1.03-.7-1.92-1.58-2.62-2.62l-4.37,1.81-1.53-3.7,4.37-1.81c-.24-1.23-.24-2.48,0-3.7l-4.37-1.81,1.53-3.7,4.36,1.81c.7-1.03,1.58-1.92,2.62-2.62l-1.81-4.37,3.7-1.53,1.81,4.37c1.22-.24,2.48-.24,3.7,0l1.81-4.37,3.7,1.53-1.81,4.36c1.03.7,1.92,1.58,2.62,2.62l4.37-1.81,1.53,3.7-4.37,1.81c.24,1.23.24,2.48,0,3.7Zm-4.27-4.1c-.6-1.45-1.73-2.58-3.18-3.18-.72-.3-1.49-.45-2.25-.45s-1.52.15-2.25.45c-1.45.6-2.58,1.73-3.18,3.18-.6,1.45-.6,3.04,0,4.49.6,1.45,1.73,2.58,3.18,3.18,1.45.6,3.04.6,4.49,0,1.45-.6,2.58-1.73,3.18-3.18.6-1.45.6-3.04,0-4.49Z');
    return myAccountFillIcon;
}

export function getInfoIcon() {
    const infoIcon = createSVGElement(viewBox, 'm32,64C14.35,64,0,49.64,0,32S14.35,0,32,0s32,14.35,32,32-14.36,32-32,32Zm0-60c-15.44,0-28,12.56-28,28s12.56,28,28,28,28-12.56,28-28S47.44,4,32,4Zm2,12h-4v24h4v-24Zm0,28h-4v4h4v-4Z');
    return infoIcon;
}

export function getInfoFillIcon() {
    const infoFillIcon = createSVGElement(viewBox, 'm32,0C14.33,0,0,14.33,0,32s14.33,32,32,32,32-14.33,32-32S49.67,0,32,0Zm2,48h-4v-4h4v4Zm0-8h-4v-24h4v24Z');
    return infoFillIcon;
}
