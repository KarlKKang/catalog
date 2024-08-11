import { appendChild } from '../../node/append_child';
import { d } from '../../document';

export function createSVGElement(viewBox: string, path: string) {
    const svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBox);
    addSVGPath(svg, path);
    return svg;
}
function addSVGPath(svg: SVGSVGElement, path: string) {
    const svgPath = d.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('d', path);
    appendChild(svg, svgPath);
}
