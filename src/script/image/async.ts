import {
    removeRightClick,
} from '../module/common';
import {
    w,
    createDivElement,
    addClass,
    appendChild,
    body,
} from '../module/dom';
import { showMessage } from '../module/message';
import { notFound } from '../module/server/message';
import { encodeCFURIComponent } from '../module/common/pure';
import { setWidth } from '../module/style';
import { CSS_UNIT } from '../module/style/value';
import * as styles from '../../css/image.module.scss';
import { imageLoader, offload as offloadImageLoader } from '../module/image_loader';

export default function (baseURL: string, fileName: string) {
    const flexContainer = createDivElement();
    addClass(flexContainer, styles.flexContainer);
    const container = createDivElement();
    addClass(container, styles.imageContainer);
    const overlay = createDivElement();
    addClass(overlay, styles.overlay);
    appendChild(container, overlay);
    appendChild(flexContainer, container);
    appendChild(body, flexContainer);
    removeRightClick(container);

    imageLoader(container, baseURL + encodeCFURIComponent(fileName), fileName, true, (canvas) => {
        setWidth(canvas, canvas.width / w.devicePixelRatio, CSS_UNIT.PX);
        // We won't listen to DPI change since we want to allow the user to zoom in and out.
        // This has the side effect of not updating the image size when the screen DPI actually changes.
    }, undefined, () => {
        showMessage(notFound);
    });
}

export function offload() {
    offloadImageLoader();
}