export const enum InputFieldElementKey {
    CONTAINER,
    INPUT,
}
export interface InputFieldElement {
    [InputFieldElementKey.CONTAINER]: HTMLDivElement;
    [InputFieldElementKey.INPUT]: HTMLInputElement;
}
