export function joinHttpForms(...forms: (string | undefined)[]) {
    return forms.filter((form) => form !== undefined && form !== '').join('&');
}
