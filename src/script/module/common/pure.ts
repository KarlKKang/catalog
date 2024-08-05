// This module contains exports that doesn't depend on any other modules.

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+[\]{}\\|;:'",<.>/?]{8,64}$/;
export const EMAIL_REGEX = /^(?=.{3,254}$)[^\s@]+@[^\s@]+$/;

export const AUTH_FAILED = 'FAILED';
export const AUTH_FAILED_TOTP = 'FAILED TOTP';
export const AUTH_DEACTIVATED = 'DEACTIVATED';
export const AUTH_TOO_MANY_REQUESTS = 'TOO MANY REQUESTS';
