const EMAIL_REGEX = /^(?=.{3,254}$)[^\s@]+@[^\s@]+$/;

export function testEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}
