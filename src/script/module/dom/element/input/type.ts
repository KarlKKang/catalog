export const enum StyledInputElementKey {
    CONTAINER,
    INPUT,
}
export interface StyledInputElement {
    [StyledInputElementKey.CONTAINER]: HTMLDivElement;
    [StyledInputElementKey.INPUT]: HTMLInputElement;
}
