import { appendChild } from '../../node/append_child';
import { setAttribute } from '../../attr/set';
import { createElementNS } from '../internal/create_element_ns';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createSVGElement(viewBox: string, path: string) {
    const svg = createElementNS(SVG_NS, 'svg');
    setAttribute(svg, 'viewBox', viewBox);
    addSVGPath(svg, path);
    return svg;
}

function addSVGPath(svg: SVGSVGElement, path: string) {
    const svgPath = createElementNS(SVG_NS, 'path');
    setAttribute(svgPath, 'd', path);
    appendChild(svg, svgPath);
}
