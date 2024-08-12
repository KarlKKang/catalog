const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+[\]{}\\|;:'",<.>/?]{8,64}$/;

export function testPassword(password: string) {
    return PASSWORD_REGEX.test(password);
}
