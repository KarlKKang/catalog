import type { addTimeoutNative } from './add/native/timeout';

export type Timeout = ReturnType<typeof addTimeoutNative>;
export type Interval = ReturnType<typeof setInterval>;
